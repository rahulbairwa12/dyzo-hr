import React from "react";
import Chart from "react-apexcharts";
import useDarkMode from "@/hooks/useDarkMode";

const BasicArea = ({ height = 350, performanceData = [] }) => {
  const [isDark] = useDarkMode();

  // Map the API data to the chart format
  const series = [
    {
      name: "Total Working Hours", // Give a name to the series
      data: performanceData.map(item => item.total_working_hours),
    },
  ];
  const categories = performanceData.map(item => item.month);

  const options = {
    chart: {
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 4,
    },
    colors: ["#4669FA"],
    tooltip: {
      theme: "dark",
    },
    grid: {
      show: true,
      borderColor: isDark ? "#334155" : "#e2e8f0",
      strokeDashArray: 10,
      position: "back",
    },
    fill: {
      type: "gradient",
      colors: ["#4669FA"],
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.5,
        stops: [50, 100, 0],
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? "#CBD5E1" : "#475569",
          fontFamily: "Inter",
        },
        formatter: function (val) {
          return `${val} hrs`;
        },
      },
      title: {
        text: "Total Working Hours",
        style: {
          color: isDark ? "#CBD5E1" : "#475569",
          fontFamily: "Inter",
        },
      },
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: isDark ? "#CBD5E1" : "#475569",
          fontFamily: "Inter",
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  };

  return (
    <div>
      <Chart options={options} series={series} type="area" height={height} />
    </div>
  );
};

export default BasicArea;
