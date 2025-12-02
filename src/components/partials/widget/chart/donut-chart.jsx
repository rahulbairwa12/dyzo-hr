import React, { useMemo } from "react";
import Chart from "react-apexcharts";
import useDarkMode from "@/hooks/useDarkMode";
import { colors } from "@/constant/data";

const DonutChart = ({ height = 113, total_task = 0, completed_task = 0 }) => {
  const [isDark] = useDarkMode();

  function colorOpacity(color, opacity) {
    const _opacity = Math.min(Math.max(opacity || 1, 0), 1);
    const hexOpacity = Math.floor(_opacity * 255).toString(16).padStart(2, '0').toUpperCase();
    return color + hexOpacity;
  }

  const { series, options } = useMemo(() => {
    const completedPercentage = total_task > 0 ? (completed_task / total_task * 100) : 0;
    const remainingPercentage = 100 - completedPercentage;

    const series = [completedPercentage, remainingPercentage];

    const options = {
      labels: ["Completed", "Remaining"],
      dataLabels: {
        enabled: false,
      },
      colors: [colors.success, colorOpacity(colors.info, 0.16)],
      legend: {
        position: "bottom",
        fontSize: "12px",
        fontFamily: "Inter",
        fontWeight: 400,
        show: false,
      },
      plotOptions: {
        pie: {
          donut: {
            size: "40%",
            labels: {
              show: true,
              value: {
                show: true,
                fontSize: "16px",
                fontFamily: "Inter",
                color: isDark ? "#cbd5e1" : "#475569",
                formatter(val) {
                  return `${parseInt(val)}%`;
                },
              },
              total: {
                show: true,
                fontSize: "10px",
                label: "Total",
                color: isDark ? "#cbd5e1" : "#475569",
                formatter() {
                  return `${completed_task}/${total_task} Completed`;
                },
              },
            },
          },
        },
      },
    };
    return { series, options };
  }, [total_task, completed_task, isDark]);

  return (
    <div>
      <Chart options={options} series={series} type="donut" height={height} />
    </div>
  );
};

export default DonutChart;
