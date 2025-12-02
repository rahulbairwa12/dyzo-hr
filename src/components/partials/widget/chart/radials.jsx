import React from "react";
import Chart from "react-apexcharts";
import useDarkMode from "@/hooks/useDarkMode";
import useWidth from "@/hooks/useWidth";

const RadialsChart = ({ totalTasksData }) => {
  const [isDark] = useDarkMode();
  const { width, breakpoints } = useWidth();

  const series = [
    totalTasksData?.total_tasks || 0,
    totalTasksData?.in_progress || 0,
    totalTasksData?.pending || 0,
    totalTasksData?.completed || 0,
    totalTasksData?.archive || 0,
    totalTasksData?.stack || 0
  ];

  const totalTasks = totalTasksData?.total_tasks;

  const options = {
    chart: {
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      radialBar: {
        dataLabels: {
          name: {
            fontSize: "22px",
            color: isDark ? "#CBD5E1" : "#475569",
          },
          value: {
            fontSize: "16px",
            color: isDark ? "#CBD5E1" : "#475569",
            formatter: function (val) {
              return val;
            }
          },
          total: {
            show: true,
            label: "Complete",
            color: isDark ? "#CBD5E1" : "#475569",
            formatter: function (val) {
              const total = val.config.series[0];
              const sumOfOthers = val.config.series[3];
              return `${sumOfOthers} / ${total}`;
            }
          },
        },
        track: {
          background: "#E2E8F0",
          strokeWidth: "97%",
        },
      },
    },
    labels: ["Total", "In Progress", "Pending", "Completed", "Archive", "Stack"],
    colors: ["#4669FA", "#FA916B", "#50C793", "#0CE7FA", "#9966FF", "#d8314b"],
    tooltip: {
      y: {
        formatter: function (val) {
          return val;
        },
      },
    },
  };

  return (
    <div>
      <Chart
        options={options}
        series={series}
        type="radialBar"
        height={width > breakpoints.md ? 360 : 250}
      />
    </div>
  );
};

export default RadialsChart;
