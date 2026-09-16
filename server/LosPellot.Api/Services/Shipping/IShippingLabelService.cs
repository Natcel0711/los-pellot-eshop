namespace LosPellot.Api.Services.Shipping;

public record ShippingAddress(
    string Name, string Street1, string? Street2, string City, string State,
    string Zip, string Country, string? Phone, string? Email);

public record Parcel(decimal WeightLb, decimal LengthIn, decimal WidthIn, decimal HeightIn);

// A quoted, purchasable rate from one carrier/service combination. RateId is
// provider-specific and opaque to callers — it's handed back verbatim to
// PurchaseLabelAsync to buy that exact rate.
public record ShippingRate(
    string RateId, string Carrier, string ServiceLevel, decimal Amount, string Currency, string? EstimatedDays);

public record PurchasedLabel(
    string ProviderTransactionId, string LabelUrl, string TrackingNumber, string? TrackingUrlProvider,
    string Carrier, string ServiceLevel, decimal Amount, string Currency);

// The one seam a real shipping provider implements. ShippoLabelService is
// the only implementation today — it talks to Shippo's real API (including
// its free test mode, which returns realistic fake labels/tracking numbers
// with no money involved) rather than simulating anything itself, since
// unlike payments there's no reason to mock this: quoting rates costs
// nothing, and Shippo's own test mode already provides a safe sandbox.
public interface IShippingLabelService
{
    Task<List<ShippingRate>> GetRatesAsync(ShippingAddress from, ShippingAddress to, Parcel parcel, CancellationToken ct = default);

    // Takes the whole previously-quoted rate (not just its id) so the
    // display fields (carrier/service/amount) we persist come from the
    // rate the admin actually saw and picked, rather than depending on
    // exactly what a provider's purchase-confirmation response happens to
    // echo back.
    Task<PurchasedLabel> PurchaseLabelAsync(ShippingRate rate, CancellationToken ct = default);
}
