import React from "react";
import Card from "../../components/ui/Card";
import "./skeleton.css"; // Import the skeleton styles

const NewPlanSkeleton = () => {
  return (
    <Card>
      <div className="w-full bg-white">
        <div className="max-w-4xl mx-auto py-6 px-4">
          {/* Header Skeleton */}
          <div className="text-center mb-10">
            <div className="h-10 w-3/5 mx-auto bg-gray-200 rounded-md skeleton-shimmer mb-4"></div>
            <div className="h-4 w-3/4 mx-auto bg-gray-200 rounded-md skeleton-shimmer"></div>
          </div>

          {/* UPI Warning Banner Skeleton */}
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg skeleton-shimmer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-6 w-6 bg-yellow-200 rounded-full mr-2"></div>
                <div className="h-5 w-64 bg-yellow-100 rounded"></div>
              </div>
              <div className="h-8 w-32 bg-yellow-100 rounded-md"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - More compact spacing */}
            <div className="space-y-4">
              {/* Current User Limit Card */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl shadow-sm border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 w-32 bg-purple-200 rounded skeleton-shimmer"></div>
                  <div className="h-5 w-5 bg-purple-200 rounded skeleton-shimmer"></div>
                </div>
                <div className="h-8 w-24 bg-purple-100 rounded skeleton-shimmer"></div>
              </div>

              {/* User Input Card */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="mb-4">
                  <div className="h-5 w-64 bg-gray-200 rounded-md skeleton-shimmer mb-3"></div>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <div className="w-full h-12 bg-gray-200 rounded-lg skeleton-shimmer"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-9 h-9 bg-gray-200 rounded-lg skeleton-shimmer"></div>
                      <div className="w-9 h-9 bg-gray-200 rounded-lg skeleton-shimmer"></div>
                    </div>
                  </div>
                </div>

                {/* Total Users Calculation */}
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <div className="h-4 w-40 bg-blue-200 rounded mb-3 skeleton-shimmer"></div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-8 w-10 bg-white rounded-md shadow-sm skeleton-shimmer"></div>
                    <div className="h-4 w-4 bg-blue-200 rounded skeleton-shimmer"></div>
                    <div className="h-8 w-10 bg-white rounded-md shadow-sm skeleton-shimmer"></div>
                    <div className="h-4 w-4 bg-blue-200 rounded skeleton-shimmer"></div>
                    <div className="h-8 w-10 bg-blue-100 rounded-md skeleton-shimmer"></div>
                  </div>
                </div>

                {/* Price Display */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg mb-4">
                  <div className="h-4 w-24 bg-green-200 rounded mb-2 skeleton-shimmer"></div>
                  <div className="h-8 w-32 bg-green-100 rounded mb-1 skeleton-shimmer"></div>
                  <div className="h-4 w-40 bg-green-200 rounded skeleton-shimmer"></div>
                </div>

                {/* Button */}
                <div className="h-12 w-full bg-gray-300 rounded-lg skeleton-shimmer mt-4"></div>
              </div>
            </div>

            {/* Features Included */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-5 bg-gray-200 rounded skeleton-shimmer"></div>
                <div className="h-6 w-48 bg-gray-200 rounded skeleton-shimmer"></div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 bg-gray-200 rounded-full mr-3 skeleton-shimmer"></div>
                    <div>
                      <div className="h-5 w-32 bg-gray-200 rounded skeleton-shimmer mb-1"></div>
                      <div className="h-3 w-48 bg-gray-200 rounded skeleton-shimmer"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NewPlanSkeleton; 