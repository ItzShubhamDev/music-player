import { AlertCircle, CheckCheck } from "lucide-react";
import { memo, useEffect, useState } from "react";

const Toast = ({
    message,
    type,
}: {
    message: string | null;
    type: "error" | "success";
}) => {
    const [msg, setMsg] = useState<string | null>(message);
    const [show, setShow] = useState(false);
    useEffect(() => {
        if (message) {
            setMsg(message);
            setShow(true);
            setTimeout(() => {
                setShow(false);
            }, 4500);
            setTimeout(() => {
                setMsg(null);
            }, 5000);
        }
    }, [message]);
    const background = type === "error" ? "bg-red-500" : "bg-green-500";
    return (
        <div
            className={`fixed z-50 top-0 m-4 px-4 py-2 flex min-h-10 w-56 ${background} text-white rounded-lg ${
                show ? "translate-x-0 right-0" : "translate-x-full -right-4"
            } ease-in-out duration-300`}
        >
            {type === "error" ? (
                <AlertCircle className="w-6 h-6 mr-2" />
            ) : (
                <CheckCheck className="w-6 h-6 mr-2" />
            )}
            <p className="w-full">{msg}</p>
        </div>
    );
};

export default memo(Toast);
