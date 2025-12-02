import React from "react";
import TaskHeaderSkeleton from "./TaskHeaderSkeleton";
import TaskTableSkeleton from "./TaskTableSkeleton";
import PaginationSkeleton from "./PaginationSkeleton";
import Card from "@/components/ui/Card";
import SimpleBar from "simplebar-react";

const TasksPageSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800">
      <div className="pb-2">
        <div className="px-[17px] pt-4">
          {/* Task Header Skeleton */}
          <TaskHeaderSkeleton />
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col h-[calc(100vh-180px)]">
        <div className="flex-1 overflow-hidden">
          <Card bodyClass="p-0 h-full" className="h-full border-0 shadow-none">
            <SimpleBar className="h-full">
              <TaskTableSkeleton rowCount={10} />
            </SimpleBar>
          </Card>
        </div>
      </div>
      
      {/* Pagination Skeleton */}
      <PaginationSkeleton />
    </div>
  );
};

export default TasksPageSkeleton; 