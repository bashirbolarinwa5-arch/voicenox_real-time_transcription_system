import { useCallback, useRef, useState } from "react";

export function useToast() {

    const [toast, setToast] =
        useState(null);

    const timeoutRef =
        useRef(null);


    const showToast =
        useCallback(
            ({
                 type = "info",
                 title = "VoiceNox",
                 message = "",
                 duration = 3500
             }) => {

                if (timeoutRef.current) {
                    clearTimeout(
                        timeoutRef.current
                    );
                }


                setToast({
                    type,
                    title,
                    message,
                    duration,
                    id: Date.now()
                });


                timeoutRef.current =
                    setTimeout(() => {

                        setToast(null);

                        timeoutRef.current =
                            null;

                    }, duration);

            },
            []
        );


    const hideToast =
        useCallback(() => {

            if (timeoutRef.current) {

                clearTimeout(
                    timeoutRef.current
                );

                timeoutRef.current =
                    null;
            }


            setToast(null);

        }, []);


    return {
        toast,
        showToast,
        hideToast
    };
}