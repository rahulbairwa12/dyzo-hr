import React from "react";
import Chart from "react-apexcharts";
import useDarkMode from "@/hooks/useDarkMode";

const DonutChart2 = ({ height = 200, taskStatusCounts, taskType, label, colors = ["#0CE7FA", "#E2F6FD"] }) => {
  const [isDark] = useDarkMode();

  // Get total tasks and the current task type (e.g., completed_tasks, pending_tasks)
  const totalTasks = taskStatusCounts?.total_tasks || 0;
  const taskCount = taskStatusCounts?.[taskType] || 0;

  // Calculate the percentage of the specific task type
  const taskPercentage = totalTasks > 0 ? (taskCount / totalTasks) * 100 : 0;
  const remainingPercentage = 100 - taskPercentage;

  const series = [taskPercentage, remainingPercentage]; // Task-specific vs Remaining

  const options = {
    labels: [label, "Remaining"],
    dataLabels: {
      enabled: false,
    },
    colors: [...colors],
    legend: {
      position: "bottom",
      fontSize: "12px",
      fontFamily: "Outfit",
      fontWeight: 400,
      show: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "40%",
          labels: {
            show: true,
            name: {
              show: false,
              fontSize: "14px",
              fontWeight: "bold",
              fontFamily: "Inter",
            },
            value: {
              show: true,
              fontSize: "16px",
              fontFamily: "Outfit",
              color: isDark ? "#cbd5e1" : "#0f172a",
              formatter(val) {
                return `${parseInt(val)}%`;
              },
            },
            total: {
              show: true,
              fontSize: "16px",
              label,
              formatter() {
                return `${taskCount}/${totalTasks}`;
              },
            },
          },
        },
      },
    },
  };

  return (
    <div>
      <Chart options={options} series={series} type="donut" height={height} />
    </div>
  );
};

export default DonutChart2;
