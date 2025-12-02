import React from "react";
import Chart from "react-apexcharts";

const GroupChart1 = ({ tabData }) => {
  const totalTaskProject = tabData?.totalTaskProject || [];
  const incompleteTaskProject = tabData?.incompleteTaskProject || [];
  const completedTaskProject = tabData?.completedTaskProject || [];

  const generateChartOptions = (seriesData, color) => ({
    series: [
      {
        data: seriesData.map((item) => item.task),
      },
    ],
    options: {
      chart: {
        toolbar: {
          autoSelected: "pan",
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
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
        width: 2,
      },
      colors: [color],
      tooltip: {
        theme: "light",
        custom: ({ series, seriesIndex, dataPointIndex }) => {
          const project = seriesData[dataPointIndex];
          return `<div class="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 shadow-lg">
                    <span>${project.projectname}: ${series[seriesIndex][dataPointIndex]}</span>
                  </div>`;
        },
      },
      grid: {
        show: false,
        padding: {
          left: 0,
          right: 0,
        },
      },
      yaxis: {
        show: false,
      },
      fill: {
        type: "solid",
        opacity: [0.1],
      },
      legend: {
        show: false,
      },
      xaxis: {
        categories: seriesData.map((item) => item.projectname),
        low: 0,
        offsetX: 0,
        offsetY: 0,
        show: false,
        labels: {
          low: 0,
          offsetX: 0,
          show: false,
        },
        axisBorder: {
          low: 0,
          offsetX: 0,
          show: false,
        },
      },
    },
  });

  const shapeLine1 = generateChartOptions(totalTaskProject, "#00EBFF");
  const shapeLine2 = generateChartOptions(incompleteTaskProject, "#FB8F65");
  const shapeLine3 = generateChartOptions(completedTaskProject, "#5743BE");

  const statistics = [
    {
      name: shapeLine1,
      title: "Total Tasks",
      count: tabData?.total_tasks || 0,
      bg: "bg-[#E5F9FF] dark:bg-slate-900",
    },
    {
      name: shapeLine2,
      title: "Pending Tasks",
      count: tabData?.incomplete_tasks || 0,
      bg: "bg-[#FFEDE5] dark:bg-slate-900",
    },
    {
      name: shapeLine3,
      title: "Completed Tasks",
      count: tabData?.completed_tasks || 0,
      bg: "bg-[#EAE5FF] dark:bg-slate-900",
    },
  ];

  return (
    <>
      {statistics.map((item, i) => (
        <div className={`py-[18px] px-4 rounded-[6px] ${item.bg}`} key={i}>
          <div className="flex items-center space-x-6 rtl:space-x-reverse">
            <div className="flex-none">
              <Chart
                options={item.name.options}
                series={item.name.series}
                type="area"
                height={48}
                width={48}
              />
            </div>
            <div className="flex-1">
              <div className="text-slate-800 dark:text-slate-300 text-sm mb-1 font-medium">
                {item.title}
              </div>
              <div className="text-slate-900 dark:text-white text-lg font-medium">
                {item.count}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default GroupChart1;
