using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LosPellot.Api.Services.Shipping;

// Thrown for anything Shippo itself rejects (bad address, expired rate,
// etc.) so the controller can surface a clean message instead of a raw
// exception/500. Wraps whatever Shippo's own `messages` array said.
public class ShippingProviderException(string message) : Exception(message);

// Talks to Shippo's real API (https://goshippo.com) — including its free
// test mode, which returns realistic fake labels/tracking numbers against a
// `shippo_test_...` token with no money involved. Configured via
// `Shippo:ApiToken` (see appsettings/env var — never hardcoded). Swapping to
// a different provider later means writing a new IShippingLabelService
// implementation, not touching the controller or frontend.
public class ShippoLabelService(HttpClient http) : IShippingLabelService
{
    // Shippo's fields are snake_case (address_from, object_id, ...) —
    // matched automatically here rather than hand-annotating every
    // property, which is what let a first version of this file silently
    // send PascalCase field names Shippo just ignored (discovered by
    // testing against a real token: an empty from-address round-tripped as
    // "SUCCESS" with zero rates instead of a clear error).
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    public async Task<List<ShippingRate>> GetRatesAsync(
        ShippingAddress from, ShippingAddress to, Parcel parcel, CancellationToken ct = default)
    {
        var request = new ShipmentRequest(
            ToShippoAddress(from), ToShippoAddress(to),
            [new ShippoParcel(parcel.LengthIn.ToString("0.##"), parcel.WidthIn.ToString("0.##"), parcel.HeightIn.ToString("0.##"), "in", parcel.WeightLb.ToString("0.##"), "lb")],
            Async: false);

        using var response = await http.PostAsJsonAsync("shipments/", request, JsonOptions, ct);
        var body = await response.Content.ReadFromJsonAsync<ShipmentResponse>(JsonOptions, ct)
            ?? throw new ShippingProviderException("Respuesta vacía del proveedor de envíos.");

        if (!response.IsSuccessStatusCode || string.Equals(body.Status, "ERROR", StringComparison.OrdinalIgnoreCase))
            throw new ShippingProviderException(DescribeMessages(body.Messages) ?? "No pudimos cotizar el envío.");

        var rates = body.Rates ?? [];
        if (rates.Count == 0)
            throw new ShippingProviderException(DescribeMessages(body.Messages) ?? "El proveedor no devolvió tarifas para esta dirección.");

        return rates
            .Select(r => new ShippingRate(
                r.ObjectId, r.Provider, r.ServiceLevel?.Name ?? r.Provider,
                decimal.TryParse(r.Amount, out var amount) ? amount : 0m,
                r.Currency ?? "USD",
                r.EstimatedDays.HasValue ? $"{r.EstimatedDays} día(s)" : null))
            .OrderBy(r => r.Amount)
            .ToList();
    }

    public async Task<PurchasedLabel> PurchaseLabelAsync(ShippingRate rate, CancellationToken ct = default)
    {
        var request = new TransactionRequest(rate.RateId, "PDF", Async: false);

        using var response = await http.PostAsJsonAsync("transactions/", request, JsonOptions, ct);
        var body = await response.Content.ReadFromJsonAsync<TransactionResponse>(JsonOptions, ct)
            ?? throw new ShippingProviderException("Respuesta vacía del proveedor de envíos.");

        if (!response.IsSuccessStatusCode || string.Equals(body.Status, "ERROR", StringComparison.OrdinalIgnoreCase))
            throw new ShippingProviderException(DescribeMessages(body.Messages) ?? "No pudimos comprar la etiqueta de envío.");

        return new PurchasedLabel(
            body.ObjectId, body.LabelUrl ?? "", body.TrackingNumber ?? "", body.TrackingUrlProvider,
            rate.Carrier, rate.ServiceLevel, rate.Amount, rate.Currency);
    }

    private static ShippoAddress ToShippoAddress(ShippingAddress a) => new(
        a.Name, a.Street1, a.Street2, a.City, a.State, a.Zip, ToIsoCountry(a.Country), a.Phone, a.Email);

    // This shop only ships within the US and Puerto Rico (see the public
    // Contact/checkout copy) — Puerto Rico ships as US domestic mail with
    // country "US" and state "PR", not as an international destination.
    // Checkout's country field is free text ("Puerto Rico"/"Estados
    // Unidos"), so map the two values it actually offers; anything else
    // falls back to "US" rather than sending Shippo a value it will reject.
    private static string ToIsoCountry(string country) => country switch
    {
        "Puerto Rico" or "Estados Unidos" or "US" or "USA" => "US",
        _ => "US",
    };

    private static string? DescribeMessages(List<ShippoMessage>? messages) =>
        messages is { Count: > 0 } ? string.Join(" ", messages.Select(m => m.Text)) : null;

    // ---- Shippo's wire format (snake_case JSON) — internal to this file ----

    private record ShippoAddress(
        string Name, [property: JsonPropertyName("street1")] string Street1,
        [property: JsonPropertyName("street2")] string? Street2, string City, string State,
        string Zip, string Country, string? Phone, string? Email);

    private record ShippoParcel(
        string Length, string Width, string Height,
        [property: JsonPropertyName("distance_unit")] string DistanceUnit,
        string Weight, [property: JsonPropertyName("mass_unit")] string MassUnit);

    private record ShipmentRequest(
        [property: JsonPropertyName("address_from")] ShippoAddress AddressFrom,
        [property: JsonPropertyName("address_to")] ShippoAddress AddressTo,
        List<ShippoParcel> Parcels, bool Async);

    private record ShippoServiceLevel(string Name, string Token);

    private record ShippoRate(
        [property: JsonPropertyName("object_id")] string ObjectId,
        string Amount, string Currency, string Provider,
        [property: JsonPropertyName("servicelevel")] ShippoServiceLevel? ServiceLevel,
        [property: JsonPropertyName("estimated_days")] int? EstimatedDays);

    private record ShippoMessage(string? Source, string Text);

    private record ShipmentResponse(
        [property: JsonPropertyName("object_id")] string ObjectId,
        string Status, List<ShippoRate>? Rates, List<ShippoMessage>? Messages);

    private record TransactionRequest(
        string Rate, [property: JsonPropertyName("label_file_type")] string LabelFileType, bool Async);

    private record TransactionResponse(
        [property: JsonPropertyName("object_id")] string ObjectId, string Status,
        [property: JsonPropertyName("tracking_number")] string? TrackingNumber,
        [property: JsonPropertyName("tracking_url_provider")] string? TrackingUrlProvider,
        [property: JsonPropertyName("label_url")] string? LabelUrl,
        List<ShippoMessage>? Messages);
}
