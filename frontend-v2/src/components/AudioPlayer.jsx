import React, { useState, useRef } from "react";

function AudioPlayer({ src }) {
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const audioRef = useRef(null);

    function togglePlay() {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        if (audio.paused) {
            audio.play().catch((error) => {
                console.error("Play failed:", error);
                setPlaying(false);
            });
        } else {
            audio.pause();
        }
    }

    function handlePlay() {
        setPlaying(true);
    }

    function handlePause() {
        setPlaying(false);
    }

    function handleLoadedMetadata() {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        setDuration(audio.duration || 0);
    }

    function handleTimeUpdate() {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        setCurrentTime(audio.currentTime);
    }

    function handleEnded() {
        setPlaying(false);
        setCurrentTime(0);
    }

    function handleSeek(event) {
        const newTime = Number(event.target.value);
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        audio.currentTime = newTime;
        setCurrentTime(newTime);
    }

    function formatTime(seconds) {
        if (!seconds || !Number.isFinite(seconds)) {
            return "0:00";
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
    }

    return (
        <div className="audio-player">

            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onPlay={handlePlay}
                onPause={handlePause}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
            />

            <button
                className={`audio-play-button ${
                    playing ? "is-playing" : "is-paused"
                }`}
                onClick={togglePlay}
                type="button"
                aria-label={playing ? "Pause recording" : "Play recording"}
            >
                {playing ? "PAUSE" : "PLAY"}            </button>

            <div className="audio-player-content">

                <div className="audio-progress-row">

                    <span className="audio-time">
                        {formatTime(currentTime)}
                    </span>

                    <input
                        className="audio-progress"
                        type="range"
                        min="0"
                        max={duration || 0}
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeek}
                        disabled={!duration}
                    />

                    <span className="audio-time">
                        {formatTime(duration)}
                    </span>

                </div>

            </div>
        </div>
    );
}

export default AudioPlayer;