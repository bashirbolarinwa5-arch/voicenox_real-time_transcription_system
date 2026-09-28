import React, { useEffect, useRef, useState } from "react";
import { getAudioUrl } from "../services/api";

function RecordingList({
                           recordings,
                           onDeleteRecording
                       }) {

    return (
        <section className="recordings-panel">

            <div className="recordings-header">

                <div>

                    <span className="section-label">
                        AUDIO HISTORY
                    </span>

                    <h3>
                        Attached Recordings
                    </h3>

                </div>

                <span className="recording-count">
                    {recordings.length}
                </span>

            </div>

            {recordings.length === 0 ? (

                <div className="no-recordings">

                    <div className="no-recordings-icon">
                        ◇
                    </div>

                    <strong>
                        No recordings yet
                    </strong>

                    <span>
                        Start recording to attach audio to this note.
                    </span>

                </div>

            ) : (

                <div className="recordings-list">

                    {recordings.map((recording, index) => (

                        <RecordingCard
                            key={recording.id}
                            recording={recording}
                            index={index}
                            onDelete={onDeleteRecording}
                        />

                    ))}

                </div>

            )}

        </section>
    );
}

function RecordingCard({
                           recording,
                           index,
                           onDelete
                       }) {

    return (
        <article className="recording-card">

            <div className="recording-number">
                {String(index + 1).padStart(2, "0")}
            </div>

            <div className="recording-content">

                <div className="recording-top">

                    <div>

                        <strong>
                            Recording {index + 1}
                        </strong>

                        <span>
                            {formatDate(recording.createdAt)}
                        </span>

                    </div>


                    <button
                        className="delete-recording"
                        onClick={() =>
                            onDeleteRecording(recording.id)
                        }
                        title="Remove recording"
                    >
                        ×
                    </button>


                </div>

                <CustomAudioPlayer
                    src={getAudioUrl(recording.audioUrl)}
                />

                {recording.transcription && (
                    <div className="recording-transcription">
                        {recording.transcription}
                    </div>
                )}

            </div>

        </article>
    );
}

function CustomAudioPlayer({ src }) {

    const audioRef = useRef(null);

    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {

        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        const handleLoadedMetadata = () => {
            setDuration(audio.duration || 0);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime || 0);
        };

        const handleEnded = () => {
            setPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener(
            "loadedmetadata",
            handleLoadedMetadata
        );

        audio.addEventListener(
            "timeupdate",
            handleTimeUpdate
        );

        audio.addEventListener(
            "ended",
            handleEnded
        );

        return () => {

            audio.removeEventListener(
                "loadedmetadata",
                handleLoadedMetadata
            );

            audio.removeEventListener(
                "timeupdate",
                handleTimeUpdate
            );

            audio.removeEventListener(
                "ended",
                handleEnded
            );

        };

    }, []);

    async function togglePlay() {

        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        if (playing) {

            audio.pause();

            setPlaying(false);

        } else {

            try {

                await audio.play();

                setPlaying(true);

            } catch (error) {

                console.error(
                    "Unable to play audio:",
                    error
                );

            }

        }
    }

    function handleSeek(event) {

        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        const value = Number(event.target.value);

        audio.currentTime = value;

        setCurrentTime(value);
    }

    const progress =
        duration > 0
            ? (currentTime / duration) * 100
            : 0;

    return (
        <div className="custom-audio-player">

            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
            />

            <button
                type="button"
                className="audio-play-button"
                onClick={togglePlay}
                title={playing ? "Pause" : "Play"}
            >
                {playing ? "Ⅱ" : "▶"}
            </button>

            <span className="audio-time">
                {formatTime(currentTime)}
            </span>

            <div className="audio-progress-wrapper">

                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    step="0.01"
                    value={currentTime}
                    onChange={handleSeek}
                    className="audio-progress"
                    style={{
                        "--progress": `${progress}%`
                    }}
                />

            </div>

            <span className="audio-time">
                {formatTime(duration)}
            </span>

        </div>
    );
}

function formatDate(date) {

    if (!date) {
        return "";
    }

    return new Date(date).toLocaleString(
        undefined,
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "0:00";
    }

    const minutes =
        Math.floor(seconds / 60);

    const remainingSeconds =
        Math.floor(seconds % 60);

    return `${minutes}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}

export default RecordingList;