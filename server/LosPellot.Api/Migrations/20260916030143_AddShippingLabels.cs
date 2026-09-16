using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LosPellot.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddShippingLabels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ShippingLabels",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    OrderId = table.Column<int>(type: "INTEGER", nullable: false),
                    Provider = table.Column<string>(type: "TEXT", nullable: false),
                    ProviderTransactionId = table.Column<string>(type: "TEXT", nullable: false),
                    LabelUrl = table.Column<string>(type: "TEXT", nullable: false),
                    TrackingNumber = table.Column<string>(type: "TEXT", nullable: false),
                    TrackingUrlProvider = table.Column<string>(type: "TEXT", nullable: true),
                    Carrier = table.Column<string>(type: "TEXT", nullable: false),
                    ServiceLevel = table.Column<string>(type: "TEXT", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Currency = table.Column<string>(type: "TEXT", nullable: false),
                    WeightLb = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    LengthIn = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    WidthIn = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    HeightIn = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShippingLabels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShippingLabels_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShippingLabels_OrderId",
                table: "ShippingLabels",
                column: "OrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShippingLabels");
        }
    }
}
