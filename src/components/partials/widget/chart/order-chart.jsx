import React from "react";
import Chart from "react-apexcharts";
import { colors } from "@/constant/data";

const OrderChart = ({
  className = "bg-slate-50 dark:bg-slate-900 rounded pt-3 px-4",
  barColor = colors.warning,
  title = "Orders",
  value = "123k",  // Default value (can be overridden)
  description = "From last week",
  percentage = "-60%",  // Default percentage (can be overridden)
  seriesData = [40, 70, 45, 100, 75, 40, 80, 90],  // Default chart data (can be overridden)
}) => {
  const series = [
    {
      name: "Value",
      data: seriesData,
    },
  ];

  const options = {
    chart: {
      toolbar: {
        show: false,
      },
      offsetX: 0,
      offsetY: 0,
      zoom: {
        enabled: false,
      },
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      bar: {
        columnWidth: "60px",
        barHeight: "100%",
      },
    },
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val;  // Show the raw value, as it's not always money
        },
      },
    },
    yaxis: {
      show: false,
    },
    xaxis: {
      show: false,
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    colors: barColor,
    grid: {
      show: false,
    },
  };

  return (
    <div className={className}>
      <div className="text-sm text-slate-600 dark:text-slate-300 mb-[6px]">
        {title}
      </div>
      <div className="text-lg text-slate-900 dark:text-white font-medium mb-[6px]">
        {value}
      </div>
      <div className="font-normal text-xs text-slate-600 dark:text-slate-300">
        <span className="text-warning-500">{percentage} </span>
        {description}
      </div>
      <div className="mt-4">
        <Chart type="bar" height="44" options={options} series={series} />
      </div>
    </div>
  );
};

export default OrderChart;
