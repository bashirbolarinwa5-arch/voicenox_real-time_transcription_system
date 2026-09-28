import React from "react";

function AnimatedOrb({ active = false }) {

    return (
        <div className={`voice-orb-container ${active ? "orb-active" : ""}`}>

            <div className="orb-glow"></div>

            <div className="orb-ring ring-one"></div>
            <div className="orb-ring ring-two"></div>
            <div className="orb-ring ring-three"></div>

            <div className="orbit orbit-one">
                <span></span>
            </div>

            <div className="orbit orbit-two">
                <span></span>
            </div>

            <div className="orbit orbit-three">
                <span></span>
            </div>

            <div className="voice-orb">

                <div className="orb-inner-glow"></div>

                <div className="orb-wave wave-one"></div>
                <div className="orb-wave wave-two"></div>

                <div className="orb-core">

                    <div className="orb-mic">
                        ●
                    </div>

                </div>

            </div>

            {active && (
                <>
                    <div className="orb-pulse pulse-one"></div>
                    <div className="orb-pulse pulse-two"></div>
                    <div className="orb-pulse pulse-three"></div>
                </>
            )}

        </div>
    );
}

export default AnimatedOrb;