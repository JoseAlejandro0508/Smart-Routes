using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Smart_Routes.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RouteGenerationAndMap : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RouteParameters_BalanceParameters_BalanceParameterId",
                table: "RouteParameters");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Routes_ScheduledDate",
                table: "Routes");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Routes_VehicleCapacityKg",
                table: "Routes");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_RouteId_ReviewedAt",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "CreationDate",
                table: "Routes");

            migrationBuilder.DropColumn(
                name: "VehicleCapacityKg",
                table: "Routes");

            migrationBuilder.DropColumn(
                name: "AppliedValue",
                table: "RouteParameters");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "RoleType",
                table: "AspNetUsers");

            migrationBuilder.RenameColumn(
                name: "BalanceParameterId",
                table: "RouteParameters",
                newName: "BalanceCriterionId");

            migrationBuilder.RenameIndex(
                name: "IX_RouteParameters_BalanceParameterId",
                table: "RouteParameters",
                newName: "IX_RouteParameters_BalanceCriterionId");

            migrationBuilder.AddColumn<double>(
                name: "X",
                table: "Stops",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Y",
                table: "Stops",
                type: "float",
                nullable: true);

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "ScheduledDate",
                table: "Routes",
                type: "datetimeoffset",
                nullable: false,
                oldClrType: typeof(DateOnly),
                oldType: "date");

            migrationBuilder.AddColumn<int>(
                name: "BalanceCriterionId",
                table: "Routes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BalanceCriterioId",
                table: "Reviews",
                type: "int",
                nullable: true);

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

            migrationBuilder.AddColumn<double>(
                name: "X",
                table: "DistributionCenters",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Y",
                table: "DistributionCenters",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "DeliveryPersons",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "AppliedValue",
                table: "BalanceParameters",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastName",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Routes_BalanceCriterionId",
                table: "Routes",
                column: "BalanceCriterionId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Routes_ScheduledDate",
                table: "Routes",
                sql: "CAST([ScheduledDate] AS date) >= CAST([Created] AS date)");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_BalanceCriterioId",
                table: "Reviews",
                column: "BalanceCriterioId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_RouteId",
                table: "Reviews",
                column: "RouteId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_BalanceCriteria_BalanceCriterioId",
                table: "Reviews",
                column: "BalanceCriterioId",
                principalTable: "BalanceCriteria",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RouteParameters_BalanceCriteria_BalanceCriterionId",
                table: "RouteParameters",
                column: "BalanceCriterionId",
                principalTable: "BalanceCriteria",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Routes_BalanceCriteria_BalanceCriterionId",
                table: "Routes",
                column: "BalanceCriterionId",
                principalTable: "BalanceCriteria",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_BalanceCriteria_BalanceCriterioId",
                table: "Reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_RouteParameters_BalanceCriteria_BalanceCriterionId",
                table: "RouteParameters");

            migrationBuilder.DropForeignKey(
                name: "FK_Routes_BalanceCriteria_BalanceCriterionId",
                table: "Routes");

            migrationBuilder.DropIndex(
                name: "IX_Routes_BalanceCriterionId",
                table: "Routes");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Routes_ScheduledDate",
                table: "Routes");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_BalanceCriterioId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_RouteId",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "X",
                table: "Stops");

            migrationBuilder.DropColumn(
                name: "Y",
                table: "Stops");

            migrationBuilder.DropColumn(
                name: "BalanceCriterionId",
                table: "Routes");

            migrationBuilder.DropColumn(
                name: "BalanceCriterioId",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "OperationsSupervisors");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "LogisticsCoordinators");

            migrationBuilder.DropColumn(
                name: "X",
                table: "DistributionCenters");

            migrationBuilder.DropColumn(
                name: "Y",
                table: "DistributionCenters");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "DeliveryPersons");

            migrationBuilder.DropColumn(
                name: "AppliedValue",
                table: "BalanceParameters");

            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastName",
                table: "AspNetUsers");

            migrationBuilder.RenameColumn(
                name: "BalanceCriterionId",
                table: "RouteParameters",
                newName: "BalanceParameterId");

            migrationBuilder.RenameIndex(
                name: "IX_RouteParameters_BalanceCriterionId",
                table: "RouteParameters",
                newName: "IX_RouteParameters_BalanceParameterId");

            migrationBuilder.AlterColumn<DateOnly>(
                name: "ScheduledDate",
                table: "Routes",
                type: "date",
                nullable: false,
                oldClrType: typeof(DateTimeOffset),
                oldType: "datetimeoffset");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CreationDate",
                table: "Routes",
                type: "datetimeoffset",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<decimal>(
                name: "VehicleCapacityKg",
                table: "Routes",
                type: "decimal(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "AppliedValue",
                table: "RouteParameters",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ReviewedAt",
                table: "Reviews",
                type: "datetimeoffset",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "AspNetUsers",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RoleType",
                table: "AspNetUsers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Routes_ScheduledDate",
                table: "Routes",
                sql: "[ScheduledDate] >= CAST([CreationDate] AS date)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Routes_VehicleCapacityKg",
                table: "Routes",
                sql: "[VehicleCapacityKg] > 0");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_RouteId_ReviewedAt",
                table: "Reviews",
                columns: new[] { "RouteId", "ReviewedAt" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_RouteParameters_BalanceParameters_BalanceParameterId",
                table: "RouteParameters",
                column: "BalanceParameterId",
                principalTable: "BalanceParameters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
