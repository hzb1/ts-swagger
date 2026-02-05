import clsx from "clsx";

const getTagColor = (method: string, isActive: boolean) => {
  const methodUpperCase = method.toUpperCase();
  if (methodUpperCase === "GET") {
    return isActive
      ? "bg-[#2AB673] text-[#FFFFFF]"
      : "bg-green-400/20 dark:bg-green-400/20 text-green-700 dark:text-green-400";
  } else if (methodUpperCase === "POST") {
    return isActive
      ? "bg-[#3064E3] text-[#FFFFFF]"
      : "bg-blue-400/20 dark:bg-blue-400/20 text-blue-700 dark:text-blue-400";
  } else if (methodUpperCase === "PUT") {
    return isActive
      ? "bg-[#FF9F00] text-[#FFFFFF]"
      : "bg-orange-400/20 dark:bg-orange-400/20 text-orange-700 dark:text-orange-400";
  } else if (methodUpperCase === "DELETE") {
    return isActive
      ? "bg-[#FF4D4F] text-[#FFFFFF]"
      : "bg-red-400/20 dark:bg-red-400/20 text-red-700 dark:text-red-400";
  }
};

const methodTextMap: Record<string, string> = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DEL"
};

const Method = ({
                  method,
                  className,
                  isActive
                }: {
  method: string;
  className?: string;
  isActive: boolean;
}) => {
  const methodUpperCase = method.toUpperCase();

  const tagColor = getTagColor(method, isActive);
  const methodText = methodTextMap[methodUpperCase] ?? methodUpperCase;
  return (
    <div
      className={clsx(
        "px-1 py-0.5 rounded-md text-[0.55rem] leading-tight font-bold w-10 text-center",
        tagColor,
        className
      )}
    >
      {methodText}
    </div>
  );
};

export default Method;
