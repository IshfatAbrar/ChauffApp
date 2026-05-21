import React, { useState, useEffect } from "react";

const StepProgress = ({ timeline, stopoverLength }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    // Base steps
    const baseSteps = [
      { title: "Booking Accepted", content: "Booking has been accepted" },
      {
        title: "Arrived at Start Location",
        content: "Your chauffeur has arrived at the pickup location",
      },
      {
        title: "Trip Started",
        content: "Your trip has started",
      },
    ];

    // Waypoints
    const waypointSteps = stopoverLength
      ? Array.from({ length: stopoverLength }, (_, i) => ({
          title: `Reached Waypoint ${i + 1}`,
          content: `You have reached waypoint ${i + 1}`,
        }))
      : [];

    // Final step
    const finalStep = {
      title: "Reached Final Point",
      content: "You have reached the final destination",
    };

    // Combine all steps
    const generatedSteps = [...baseSteps, ...waypointSteps, finalStep];
    setSteps(generatedSteps);

    // Determine current step
    let current = 1; // Step 1: Order Accepted
    if (timeline?.arrive) current = 2; // Step 2: Arrived at Start Location
    if (timeline?.start) current = 3; // Step 3: Trip Started
    if (timeline?.waypoints?.length > 0) {
      const completedWaypoints = timeline.waypoints.filter(
        (waypoint) => waypoint.arrival
      ).length;
      current += completedWaypoints;
    }
    if (timeline?.stop) current = generatedSteps.length; // Final step
    setCurrentStep(current);
  }, [timeline, stopoverLength]);

  return (
    <div className="flex flex-col items-start p-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start mb-4">
          {/* Step Circle */}
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs mr-4
              ${
                index + 1 <= currentStep
                  ? `${
                      index === currentStep - 1
                        ? "bg-blue-500 text-white animate-pulse"
                        : "bg-blue-500 text-white"
                    }`
                  : "bg-gray-300 text-gray-700"
              }`}
          >
            {index + 1 < currentStep ? (
              <i className="fa-solid fa-check"></i>
            ) : (
              index + 1
            )}
          </div>

          {/* Step Details */}
          <div>
            <p>{step.content}</p>
            {timeline && (
              <p className="text-sm text-gray-500">
                {index === 0
                  ? ""
                  : index === 1 && timeline.arrive
                  ? `Time: ${timeline.arrive}`
                  : index === 2 && timeline.start
                  ? `Time: ${timeline.start}`
                  : index > 2 &&
                    index < steps.length - 1 &&
                    timeline.waypoints[index - 3]?.arrival
                  ? `Time: ${timeline.waypoints[index - 3]?.arrival}`
                  : index === steps.length - 1 && timeline.stop
                  ? `Time: ${timeline.stop}`
                  : ""}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StepProgress;
