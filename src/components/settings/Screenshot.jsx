import React, { useState, useEffect, useRef } from "react";
import Textinput from "@/components/ui/Textinput";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Select from "react-select";
import { fetchAuthPatch } from "@/store/api/apiSlice";
import { useSelector, useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import { Icon } from "@iconify/react";
import { setCompanyScreenshotSettings } from "@/store/planSlice";

// Improved tooltip component with fully adaptive positioning
const Tooltip = ({ content, children }) => {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({
    vertical: "top",
    horizontal: "center",
  });
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  // Handle click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setShow(false);
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);

      // Check position after render and adjust if necessary
      setTimeout(() => {
        if (tooltipRef.current && triggerRef.current) {
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          const triggerRect = triggerRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          // Vertical positioning
          const newPosition = { ...position };

          // If tooltip is too close to top of viewport, position it below
          if (tooltipRect.top < 20) {
            newPosition.vertical = "bottom";
          } else if (viewportHeight - tooltipRect.bottom < 20) {
            newPosition.vertical = "top";
          }

          // Horizontal positioning
          // If tooltip extends beyond right edge, align to right
          if (tooltipRect.right > viewportWidth - 20) {
            newPosition.horizontal = "right";
          }
          // If tooltip extends beyond left edge, align to left
          else if (tooltipRect.left < 20) {
            newPosition.horizontal = "left";
          }

          // Update position if changed
          if (
            newPosition.vertical !== position.vertical ||
            newPosition.horizontal !== position.horizontal
          ) {
            setPosition(newPosition);
          }
        }
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, position]);

  // Calculate tooltip styles based on position
  const getTooltipStyles = () => {
    const styles = {};

    // Vertical positioning
    if (position.vertical === "top") {
      styles.bottom = "calc(100% + 10px)";
    } else {
      styles.top = "calc(100% + 10px)";
    }

    // Horizontal positioning
    if (position.horizontal === "center") {
      styles.left = "50%";
      styles.transform = "translateX(-50%)";
    } else if (position.horizontal === "left") {
      styles.left = "0";
    } else if (position.horizontal === "right") {
      styles.right = "0";
    }

    return styles;
  };

  // Get arrow positioning class
  const getArrowClass = () => {
    let baseClass =
      "absolute h-3 w-3 bg-white dark:bg-slate-800 transform rotate-45 border border-gray-200 dark:border-slate-700 ";

    // Vertical position
    if (position.vertical === "top") {
      baseClass += "-bottom-1.5 border-b border-r ";
    } else {
      baseClass += "-top-1.5 border-t border-l ";
    }

    // Horizontal position
    if (position.horizontal === "center") {
      baseClass += "left-1/2 -ml-1.5";
    } else if (position.horizontal === "left") {
      baseClass += "left-5 -ml-1.5";
    } else if (position.horizontal === "right") {
      baseClass += "right-5 -mr-1.5";
    }

    return baseClass;
  };

  return (
    <div className="relative inline-block">
      <ToastContainer />
      <button
        ref={triggerRef}
        type="button"
        className="text-blue-600 hover:text-blue-700 focus:outline-none"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        aria-label="Info"
      >
        {children}
      </button>

      {show && (
        <div
          ref={tooltipRef}
          className="absolute z-50 w-72 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-sm rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-4 transition-opacity duration-300"
          style={getTooltipStyles()}
        >
          <div
            className={`absolute h-3 w-3 bg-white dark:bg-slate-800 transform rotate-45 border border-gray-200 dark:border-slate-700 ${position.vertical === "top"
              ? "-bottom-1.5 border-b border-r"
              : "-top-1.5 border-t border-l"
              } ${position.horizontal === "center"
                ? "left-1/2 -ml-1.5"
                : position.horizontal === "left"
                  ? "left-5"
                  : "right-5"
              }`}
          ></div>
          <div className="relative z-10">{content}</div>
        </div>
      )}
    </div>
  );
};

// Simplified validation schema
const FormValidationSchema = yup
  .object({
    screenshot_mode: yup.string().required("Screenshot Mode is required"),
    interval_time: yup
      .number()
      .min(1, "minimum value is 1 and maximum value is 30")
      .max(30, "minimum value is 1 and maximum value is 30")
      .required("Inactivity Detection Time is required"),
    screenshot_time: yup
      .number()
      .min(1, "minimum value is 1 and maximum value is 30")
      .max(30, "minimum value is 1 and maximum value is 30")
      .when("screenshot_mode", {
        is: (val) => val !== "privacy_mode",
        then: yup.number().required("Screenshot Interval is required"),
        otherwise: yup.number().notRequired(),
      }),
    screenshot_reduced_time: yup
      .number()
      .min(1, "minimum value is 1 and maximum value is 30")
      .max(30, "minimum value is 1 and maximum value is 30")
      .when("screenshot_mode", {
        is: "sensitive_data_hide_mode",
        then: yup.number().required("Blurred Screenshot Interval is required"),
        otherwise: yup.number().notRequired(),
      }),
  })
  .required();

const styles = {
  multiValue: (base, state) => {
    return state.data.isFixed ? { ...base, opacity: "0.5" } : base;
  },
  multiValueLabel: (base, state) => {
    return state.data.isFixed
      ? { ...base, color: "#626262", paddingRight: 6 }
      : base;
  },
  multiValueRemove: (base, state) => {
    return state.data.isFixed ? { ...base, display: "none" } : base;
  },
  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
  }),
};

// Simplified options with clearer descriptions
const options = [
  {
    label: "Privacy Mode - No Screenshots",
    value: "privacy_mode",
  },
  {
    label: "Sensitive Data Mode - Blurred (450×252)",
    value: "sensitive_data_hide_mode",
  },
  {
    label: "Random Interval Mode (1280×720)",
    value: "random_taken_screenshot_mode",
  },
  {
    label: "Fixed Interval Mode (1280×720)",
    value: "screenshot_by_given_time_mode",
  },
];

const Screenshot = () => {
  const [updating, setUpdating] = useState(false);
  const userInfo = useSelector((state) => state.auth.user);
  const subscriptionData = useSelector((state) => state.plan.subscriptionData);
  const companyDetails = subscriptionData?.company_details;
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const dispatch = useDispatch();

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    defaultValues: {
      screenshot_time: 5,
      interval_time: 5,
      screenshot_reduced_time: 5,
      screenshot_mode: "screenshot_by_given_time_mode",
    },
  });

  // Watch the screenshot mode to conditionally render fields
  const watchScreenshotMode = watch("screenshot_mode");

  useEffect(() => {
    if (companyDetails) {
      reset({
        screenshot_time: companyDetails.screenshot_time || 5,
        interval_time: companyDetails.interval_time || 5,
        screenshot_reduced_time: companyDetails.screenshot_reduced_time || 5,
        screenshot_mode: companyDetails.screenshot_mode || "screenshot_by_given_time_mode",
      });
      setSelectedMode(companyDetails.screenshot_mode || "screenshot_by_given_time_mode");
    }
  }, [reset, companyDetails]);

  // Update the selected mode when the form field changes
  useEffect(() => {
    setSelectedMode(watchScreenshotMode);
  }, [watchScreenshotMode]);

  const updateScreenshotSettingsAPI = async (data) => {
    try {
      setUpdating(true);
      const screenshotSettingsData = {
        screenshot_time: data.screenshot_time || 5,
        interval_time: data.interval_time,
        screenshot_reduced_time: data.screenshot_reduced_time || 5,
        screenshot_mode: data.screenshot_mode,
      };
      const response = await fetchAuthPatch(
        `${import.meta.env.VITE_APP_DJANGO}/company/${userInfo?.companyId
        }/update/`,
        {
          body: screenshotSettingsData,
        }
      );
      if (response.status) {
        // Update Redux store with new screenshot settings
        dispatch(setCompanyScreenshotSettings(screenshotSettingsData));
        toast.success("Screenshot Settings Updated!");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.warning("Error: ", error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit(updateScreenshotSettingsAPI)}
        className="lg:grid-cols-2 grid gap-5 grid-cols-1"
      >
        <div className="relative lg:col-span-2">
          <div className="flex items-center mb-2">
            <label className="form-label" htmlFor="icon_s">
              Screenshot Mode
            </label>
            <Tooltip
              content={
                <div>
                  <p className="mb-2">Choose how screenshots are captured:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <span className="font-medium">Fixed Interval Mode:</span>{" "}
                      Standard resolution screenshots at regular intervals
                    </li>
                    <li>
                      <span className="font-medium">Random Interval Mode:</span>{" "}
                      Standard resolution screenshots at unpredictable times
                    </li>
                    <li>
                      <span className="font-medium">Sensitive Data Mode:</span>{" "}
                      Low-resolution blurred screenshots to protect confidential
                      information
                    </li>
                    <li>
                      <span className="font-medium">Privacy Mode:</span> No
                      screenshots, only activity tracking
                    </li>
                  </ul>
                </div>
              }
            >
              <Icon
                icon="heroicons:information-circle"
                className="w-5 h-5 ml-2"
              />
            </Tooltip>
          </div>
          <Controller
            name="screenshot_mode"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={options}
                styles={styles}
                className="react-select capitalize"
                classNamePrefix="select"
                isMulti={false}
                onChange={(option) =>
                  field.onChange(option ? option.value : "")
                }
                value={options.find((option) => option.value === field.value)}
                id="icon_s"
                isDisabled={!userInfo.isAdmin}
              />
            )}
          />
        </div>

        <div className="relative">
          <div className="flex items-center mb-2">
            <label className="form-label" htmlFor="interval_time">
              Inactivity Detection Time (Minutes)
            </label>
            <Tooltip content="Determines how long the app waits without detecting mouse or keyboard activity before considering a user inactive. After this period, time tracking pauses automatically. This helps prevent inaccurate time tracking during breaks.">
              <Icon
                icon="heroicons:information-circle"
                className="w-5 h-5 ml-2"
              />
            </Tooltip>
          </div>
          <Textinput
            name="interval_time"
            id="interval_time"
            register={register}
            error={errors.interval_time}
            placeholder="Inactivity Detection Time (Minutes)"
            disabled={!userInfo.isAdmin}
          />
        </div>

        {selectedMode && selectedMode !== "privacy_mode" && (
          <div className="relative">
            <div className="flex items-center mb-2">
              <label className="form-label" htmlFor="screenshot_time">
                Screenshot Interval (Minutes)
              </label>
              <Tooltip content="Sets the time between screenshots. For Fixed Interval Mode, screenshots are taken exactly at this interval. For Random Interval Mode, screenshots are taken randomly within this interval.">
                <Icon
                  icon="heroicons:information-circle"
                  className="w-5 h-5 ml-2"
                />
              </Tooltip>
            </div>
            <Textinput
              name="screenshot_time"
              id="screenshot_time"
              register={register}
              error={errors.screenshot_time}
              placeholder="Screenshot Interval (Minutes)"
              disabled={!userInfo.isAdmin}
            />
          </div>
        )}

        {selectedMode === "sensitive_data_hide_mode" && (
          <div className="relative">
            <div className="flex items-center mb-2">
              <label className="form-label" htmlFor="screenshot_reduced_time">
                Blurred Screenshot Interval (Minutes)
              </label>
              <Tooltip content="Controls how frequently blurred, low-resolution screenshots (450×252) are taken when using Sensitive Data Mode. These protect confidential information while still documenting activity.">
                <Icon
                  icon="heroicons:information-circle"
                  className="w-5 h-5 ml-2"
                />
              </Tooltip>
            </div>
            <Textinput
              name="screenshot_reduced_time"
              id="screenshot_reduced_time"
              register={register}
              error={errors.screenshot_reduced_time}
              placeholder="Blurred Screenshot Interval (Minutes)"
              disabled={!userInfo.isAdmin}
            />
          </div>
        )}

        {userInfo.isAdmin && (
          <div className="lg:col-span-2 col-span-1">
            <div className="ltr:text-left rtl:text-left">
              <button className="btn btn-dark text-center" type="submit">
                {updating ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default Screenshot;
