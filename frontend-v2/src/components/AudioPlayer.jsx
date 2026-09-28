import React, { useState, useRef } from "react";

function AudioPlayer({ src }) {
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);

    function togglePlay() {
        if (!audioRef.current) return;

        if (playing) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(err => {
                console.error("Play failed:", err);
            });
        }
    }

    function handleLoadedMetadata() {
        if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
        }
    }

    function handleTimeUpdate() {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    }

    function handleEnded() {
        setPlaying(false);
        setCurrentTime(0);
    }

    function handleSeek(e) {
        const newTime = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    }

    function formatTime(seconds) {
        if (!seconds || !Number.isFinite(seconds)) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${String(s).padStart(2, "0")}`;
    }

    return (
        <div className="audio-player">
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
            />

            <button
                className="audio-play-button"
                onClick={togglePlay}
                type="button"
            >
                {playing ? "❚❚" : "▶"}
            </button>

            <div className="audio-player-content">
                <div className="audio-progress-row">
                    <span className="audio-time">{formatTime(currentTime)}</span>

                    <input
                        className="audio-progress"
                        type="range"
                        min="0"
                        max={duration || 100}
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeek}
                    />

                    <span className="audio-time">{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
}

export default AudioPlayer;