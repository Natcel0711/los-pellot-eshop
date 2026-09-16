using System.Text;
using LosPellot.Api.Data;
using LosPellot.Api.Models;
using LosPellot.Api.Services;
using LosPellot.Api.Services.Payments;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Render (and most container hosts) inject the port to listen on via $PORT
// and terminate TLS upstream, forwarding plain HTTP to the container.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));

builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.Password.RequiredLength = 6;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireDigit = false;
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

var jwtSection = builder.Configuration.GetSection("Jwt");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["SigningKey"]!));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtSection["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSection["Audience"],
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = signingKey,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30),
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireClaim("is_admin", "true"));
});

builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<CartResolver>();
// The one line a future real gateway (Stripe, etc.) swap changes — see PAYMENT_INTEGRATION.md.
builder.Services.AddScoped<IPaymentService, MockPaymentService>();

builder.Services.AddCors(options =>
{
    // Allowed origins come from config so the deployed Vercel domain can be
    // added via the Cors__AllowedOrigins env var without a code change.
    // Under the recommended Vercel-rewrite-proxy setup this mostly matters
    // for local `ng serve` and any direct (non-proxied) calls to the API.
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? ["http://localhost:4200"];

    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// Ensure the uploads folder exists before UseStaticFiles() (and before any
// upload is attempted) — a fresh clone/container won't have it yet.
var webRoot = string.IsNullOrEmpty(app.Environment.WebRootPath)
    ? Path.Combine(app.Environment.ContentRootPath, "wwwroot")
    : app.Environment.WebRootPath;
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "products"));

// Apply migrations and seed on every startup (not just Development) since
// this app is deployed to a host — like Render's free tier — whose disk
// resets on redeploy, so the schema/catalog need to be (re)created each time.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await SeedData.EnsureSeededAsync(db);

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    await SeedData.EnsureAdminUserAsync(userManager);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseHttpsRedirection();
}
else
{
    // Render's load balancer terminates TLS and forwards plain HTTP;
    // trust its X-Forwarded-* headers instead of redirecting to HTTPS
    // ourselves (which would otherwise loop).
    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
    });
}

// Use an explicit PhysicalFileProvider rather than the bare overload: if wwwroot
// didn't exist yet when the host was built (first run before any upload), the
// default env.WebRootFileProvider is a NullFileProvider and won't pick up the
// directory we just created above, even though it now exists on disk.
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(webRoot),
});
app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
