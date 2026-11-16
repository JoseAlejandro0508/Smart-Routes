using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Routes.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class SchemaAuditConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "OperationsSupervisors");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "LogisticsCoordinators");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "DeliveryPersons");

            migrationBuilder.CreateTable(
                name: "RK",
                columns: table => new
                {
                    CoordinatorId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    DistributionCenterId = table.Column<int>(type: "int", nullable: false),
                    BalanceParameterId = table.Column<int>(type: "int", nullable: false),
                    ReviewId = table.Column<int>(type: "int", nullable: false),
                    DeliveryRecordId = table.Column<int>(type: "int", nullable: false),
                    ReschedulingId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RK", x => new { x.CoordinatorId, x.DistributionCenterId, x.BalanceParameterId, x.ReviewId, x.DeliveryRecordId, x.ReschedulingId });
                    table.ForeignKey(
                        name: "FK_RK_BalanceParameters_BalanceParameterId",
                        column: x => x.BalanceParameterId,
                        principalTable: "BalanceParameters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RK_DeliveryRecords_DeliveryRecordId",
                        column: x => x.DeliveryRecordId,
                        principalTable: "DeliveryRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RK_DistributionCenters_DistributionCenterId",
                        column: x => x.DistributionCenterId,
                        principalTable: "DistributionCenters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RK_LogisticsCoordinators_CoordinatorId",
                        column: x => x.CoordinatorId,
                        principalTable: "LogisticsCoordinators",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RK_Reschedulings_ReschedulingId",
                        column: x => x.ReschedulingId,
                        principalTable: "Reschedulings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RK_Reviews_ReviewId",
                        column: x => x.ReviewId,
                        principalTable: "Reviews",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Stops_Coordinates",
                table: "Stops",
                sql: "([X] IS NULL AND [Y] IS NULL) OR ([X] BETWEEN -180 AND 180 AND [Y] BETWEEN -90 AND 90)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Reviews_Decision",
                table: "Reviews",
                sql: "[Decision] IN (0, 1, 2)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Reschedulings_ManualResult",
                table: "Reschedulings",
                sql: "[ManualResult] IS NULL OR [ManualResult] IN (0, 1, 2)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Reschedulings_Status",
                table: "Reschedulings",
                sql: "[Status] IN (0, 1, 2)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Orders_DeliveryType",
                table: "Orders",
                sql: "[DeliveryType] IN (0, 1, 2)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Orders_Priority",
                table: "Orders",
                sql: "[Priority] IN (0, 1, 2)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Orders_Status",
                table: "Orders",
                sql: "[Status] IN (0, 1, 2, 3)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_DistributionCenters_Coordinates",
                table: "DistributionCenters",
                sql: "([X] IS NULL AND [Y] IS NULL) OR ([X] BETWEEN -180 AND 180 AND [Y] BETWEEN -90 AND 90)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_DeliveryRecords_Result",
                table: "DeliveryRecords",
                sql: "[Result] IN (0, 1)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_DeliveryPersons_Adult",
                table: "DeliveryPersons",
                sql: "DATEADD(year, 18, [DateOfBirth]) <= CAST(GETDATE() AS date)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_BalanceParameters_Metric",
                table: "BalanceParameters",
                sql: "[Metric] IN (0, 1, 2, 3, 4)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_BalanceParameters_Operator",
                table: "BalanceParameters",
                sql: "[Operator] IN (0, 1, 2)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_BalanceParameters_ProportionRange",
                table: "BalanceParameters",
                sql: "[Metric] <> 1 OR ([AppliedValue] >= 0 AND [AppliedValue] <= 1)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_BalanceParameters_TargetDeliveryTypeDomain",
                table: "BalanceParameters",
                sql: "[TargetDeliveryType] IS NULL OR [TargetDeliveryType] IN (0, 1, 2)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Administrators_AccessLevel",
                table: "Administrators",
                sql: "[AccessLevel] IN (0, 1)");

            migrationBuilder.CreateIndex(
                name: "IX_RK_BalanceParameterId",
                table: "RK",
                column: "BalanceParameterId");

            migrationBuilder.CreateIndex(
                name: "IX_RK_DeliveryRecordId",
                table: "RK",
                column: "DeliveryRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_RK_DistributionCenterId",
                table: "RK",
                column: "DistributionCenterId");

            migrationBuilder.CreateIndex(
                name: "IX_RK_ReschedulingId",
                table: "RK",
                column: "ReschedulingId");

            migrationBuilder.CreateIndex(
                name: "IX_RK_ReviewId",
                table: "RK",
                column: "ReviewId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RK");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Stops_Coordinates",
                table: "Stops");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Reviews_Decision",
                table: "Reviews");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Reschedulings_ManualResult",
                table: "Reschedulings");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Reschedulings_Status",
                table: "Reschedulings");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Orders_DeliveryType",
                table: "Orders");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Orders_Priority",
                table: "Orders");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Orders_Status",
                table: "Orders");

            migrationBuilder.DropCheckConstraint(
                name: "CK_DistributionCenters_Coordinates",
                table: "DistributionCenters");

            migrationBuilder.DropCheckConstraint(
                name: "CK_DeliveryRecords_Result",
                table: "DeliveryRecords");

            migrationBuilder.DropCheckConstraint(
                name: "CK_DeliveryPersons_Adult",
                table: "DeliveryPersons");

            migrationBuilder.DropCheckConstraint(
                name: "CK_BalanceParameters_Metric",
                table: "BalanceParameters");

            migrationBuilder.DropCheckConstraint(
                name: "CK_BalanceParameters_Operator",
                table: "BalanceParameters");

            migrationBuilder.DropCheckConstraint(
                name: "CK_BalanceParameters_ProportionRange",
                table: "BalanceParameters");

            migrationBuilder.DropCheckConstraint(
                name: "CK_BalanceParameters_TargetDeliveryTypeDomain",
                table: "BalanceParameters");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Administrators_AccessLevel",
                table: "Administrators");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "OperationsSupervisors",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "LogisticsCoordinators",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "DeliveryPersons",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
