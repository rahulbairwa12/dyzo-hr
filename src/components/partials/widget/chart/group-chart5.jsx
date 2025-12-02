import React from "react";
import { colors } from "@/constant/data";
import Chart from "react-apexcharts";

// Helper function to transform the datewise working hours into chart data
const mapDatewiseWorkingHoursToData = (datewiseWorkingHours) => {
  return datewiseWorkingHours && datewiseWorkingHours.length > 0
    ? datewiseWorkingHours.map((entry) => ({
        x: entry.date,
        y: parseFloat(entry.working_hours.split(":")[0]) + parseFloat(entry.working_hours.split(":")[1]) / 60,
      }))
    : [];
};

const mapLateListToData = (lateList) => {
  return lateList && lateList.length > 0
    ? lateList.map((entry) => ({
        x: entry.date,
        y: parseFloat(entry.log_time.split(":")[0]) + parseFloat(entry.log_time.split(":")[1]) / 60,
      }))
    : [];
};

const mapEarlyExitListToData = (earlyExitList) => {
  return earlyExitList && earlyExitList.length > 0
    ? earlyExitList.map((entry) => ({
        x: entry.date,
        y: parseFloat(entry.log_time.split(":")[0]) + parseFloat(entry.log_time.split(":")[1]) / 60,
      }))
    : [];
};

const GroupChart5 = ({ totalWorkingHours, datewiseWorkingHours, attendanceData }) => {
  const { late_count, late_list, early_exit_count, early_exit_list } = attendanceData || {};

  const statistics = [
    {
      name: "Total Working Hours",
      title: "Total Working Hours",
      count: totalWorkingHours,
      data: mapDatewiseWorkingHoursToData(datewiseWorkingHours),
      colors: colors.info,
    },
    {
      name: "Late Arrivals",
      title: "Late Count",
      count: `${late_count || 0} late`,
      data: mapLateListToData(late_list),
      colors: colors.warning,
    },
    {
      name: "Early Exits",
      title: "Early Exit Count",
      count: `${early_exit_count || 0} exits`,
      data: mapEarlyExitListToData(early_exit_list),
      colors: colors.success,
    },
  ];

  return (
    <>
      {statistics.map((item, i) => (
        <div className="bg-slate-50 dark:bg-slate-900 rounded p-4" key={i}>
          <div className="text-slate-600 dark:text-slate-400 text-sm mb-1 font-medium">
            {item.title}
          </div>
          <div className="text-slate-900 dark:text-white text-lg font-medium">
            {item.count}
          </div>
          <div className="ml-auto max-w-[124px]">
            <Chart
              options={{
                chart: {
                  toolbar: {
                    show: false,
                  },
                  sparkline: {
                    enabled: true,
                  },
                },
                xaxis: {
                  categories: item.data.map((point) => point.x),
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
                yaxis: {
                  show: false,
                },
                grid: {
                  show: false,
                },
                colors: item.colors,
              }}
              series={[
                {
                  name: item.name,
                  data: item.data.map((point) => point.y),
                },
              ]}
              type="bar"
              height="48"
              width="124"
            />
          </div>
        </div>
      ))}
    </>
  );
};

export default GroupChart5;
