import React from "react";
import Card from "../../components/ui/Card";

const NewPlanSkeleton = () => {
  return (
    <Card>
      <div className="w-full bg-white">
        <div className="max-w-6xl mx-auto py-8 px-4">
          {/* Header Section */}
          <div className="text-center mb-16 animate-pulse">
            <div className="h-12 w-2/3 mx-auto bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 w-1/2 mx-auto bg-gray-200 rounded mb-3"></div>
            <div className="h-4 w-3/5 mx-auto bg-gray-200 rounded"></div>
          </div>

          {/* Information Banner */}
          <div className="bg-blue-50 border border-blue-300 px-4 py-3 rounded-lg mb-12 animate-pulse">
            <div className="flex items-center">
              <div className="w-7 h-7 rounded-full bg-blue-200 flex-shrink-0 mr-3"></div>
              <div className="flex-1">
                <div className="h-5 bg-blue-100 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-blue-100 rounded w-2/3"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-10">
            {/* Left Column */}
            <div className="lg:col-span-4 space-y-10 animate-pulse">
              {/* Team Size Input */}
              <div className="flex gap-3 items-center">
                <div className="h-7 bg-gray-200 rounded-lg w-40"></div>
                <div className="w-28 h-11 bg-gray-200 rounded-md"></div>
                <div className="h-7 bg-gray-200 rounded-lg w-16"></div>
              </div>
              <hr className="border-t border-gray-200" />

              {/* Interactive Slider */}
              <div>
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
                    <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>

                {/* Slider Track */}
                <div className="relative h-2 bg-gray-200 rounded-full mb-8">
                  <div className="absolute -top-2 left-1/4 h-6 w-6 bg-white border-2 border-gray-300 rounded-full shadow-md"></div>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mb-10">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                </div>

                {/* Features */}
                <div className="pt-8 pb-10 border-t border-b border-gray-200">
                  <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
                  <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gray-300 mr-3"></div>
                        <div className="h-5 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Sales */}
                <div className="pt-8">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-10 w-48 bg-gray-200 rounded-md"></div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-3 animate-pulse">
              <div className="bg-white rounded-lg border-2 border-purple-200 shadow-md p-8 h-full">
                {/* Monthly/Annually Toggle */}
                <div className="flex items-center justify-center gap-6 mb-10">
                  <div className="h-5 w-20 bg-gray-200 rounded"></div>
                  <div className="w-14 h-7 bg-gray-300 rounded-full"></div>
                  <div className="h-5 w-36 bg-gray-200 rounded"></div>
                </div>

                {/* Price */}
                <div className="text-center mb-12">
                  <div className="h-7 w-64 mx-auto bg-gray-200 rounded-lg mb-10"></div>
                  
                  <div className="h-16 w-48 mx-auto bg-gray-200 rounded-lg mb-5"></div>
                  
                  <div className="h-4 w-56 mx-auto bg-gray-200 rounded mt-3"></div>
                  <div className="h-4 w-64 mx-auto bg-gray-200 rounded mt-2"></div>
                </div>

                {/* Subscribe Button */}
                <div className="mt-10">
                  <div className="w-full h-14 bg-gray-300 rounded-lg mb-3"></div>
                  <div className="h-4 w-48 mx-auto bg-gray-200 rounded mt-3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NewPlanSkeleton; 