import React, { useState, useEffect } from "react";

const StepProgress = ({ timeline, stopoverLength }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
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

    const waypointSteps = stopoverLength
      ? Array.from({ length: stopoverLength }, (_, i) => ({
          title: `Reached Waypoint ${i + 1}`,
          content: `You have reached waypoint ${i + 1}`,
        }))
      : [];

    const finalStep = {
      title: "Reached Final Point",
      content: "You have reached the final destination",
    };

    const generatedSteps = [...baseSteps, ...waypointSteps, finalStep];
    setSteps(generatedSteps);

    let current = 1;
    if (timeline?.arrive) current = 2;
    if (timeline?.start) current = 3;
    if (timeline?.waypoints?.length > 0) {
      const completedWaypoints = timeline.waypoints.filter(
        (waypoint) => waypoint.arrival,
      ).length;
      current += completedWaypoints;
    }
    if (timeline?.stop) current = generatedSteps.length;
    setCurrentStep(current);
  }, [timeline, stopoverLength]);

  return (
    <div className="mt-4 flex flex-col items-start border-t border-white/10 pt-4">
      {steps.map((step, index) => (
        <div key={index} className="mb-4 flex items-start last:mb-0">
          <div
            className={`mr-4 flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs ${
              index + 1 <= currentStep
                ? index === currentStep - 1
                  ? "animate-pulse bg-paper text-black"
                  : "bg-paper text-black"
                : "bg-graphite text-ash"
            }`}
          >
            {index + 1 < currentStep ? (
              <i className="fa-solid fa-check"></i>
            ) : (
              index + 1
            )}
          </div>

          <div>
            <p className="font-body text-sm text-paper">{step.content}</p>
            {timeline && (
              <p className="font-mono text-[11px] text-ash">
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
