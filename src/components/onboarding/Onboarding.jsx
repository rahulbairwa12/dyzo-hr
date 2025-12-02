import React, { useState } from 'react'
import ProjectOnboarding from './ProjectOnboarding';
import TaskOnboarding from './TaskOnboarding';
import TimerOnboarding from './TimerOnboarding';
import DownloadApp from './DownloadApp';

const Onboarding = () => {
    const [stepSize, setStepSize] = useState(0);

    return (
        <>

            {
                stepSize === 0 && <ProjectOnboarding stepSize={stepSize} setStepSize={setStepSize} />
            }

            {
                stepSize === 1 && <TaskOnboarding stepSize={stepSize} setStepSize={setStepSize} />
            }

            {
                // stepSize === 2 && <TimerOnboarding stepSize={stepSize} setStepSize={setStepSize} />
                stepSize === 2 && <DownloadApp stepSize={stepSize} setStepSize={setStepSize} />
            }

            {/* {
                stepSize === 3 && <DownloadApp stepSize={stepSize} setStepSize={setStepSize} />
            } */}

        </>




    );
}

export default Onboarding