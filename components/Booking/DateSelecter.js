"use client";

import React, { useState, useContext, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DateSelecter.css";
import { TimeContext } from "../../context/TimeContext";

function DateSelecter() {
  const { time, setTime } = useContext(TimeContext);
  const [minSelectableTime, setMinSelectableTime] = useState(null);
  const [usePortal, setUsePortal] = useState(false);

  useEffect(() => {
    const sixHoursFromNow = new Date(Date.now() + 6 * 60 * 60 * 1000);
    setMinSelectableTime(sixHoursFromNow);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setUsePortal(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const filterFutureTime = (timeSlot) => {
    const sixHoursFromNow = new Date(Date.now() + 6 * 60 * 60 * 1000);
    return new Date(timeSlot).getTime() >= sixHoursFromNow.getTime();
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
          Pickup Time
        </label>
        <div title="You can only book six hours ahead">
          <i className="fa-solid fa-circle-info text-[10px] text-ash"></i>
        </div>
      </div>
      <div className="customDatePickerWidth flex w-[100%] px-0">
        <DatePicker
          showIcon
          icon="fa fa-calendar"
          selected={time}
          onChange={(date) => setTime(date)}
          showTimeSelect
          isClearable
          dateFormat="Pp"
          popperPlacement="bottom-end"
          withPortal={usePortal}
          portalId="chauff-datepicker-portal"
          className="custom-datepicker-input w-full"
          minDate={minSelectableTime}
          filterTime={filterFutureTime}
          customInput={<CustomInput placeholderText=" Pickup Time" />}
        />
      </div>
    </div>
  );
}

const CustomInput = React.forwardRef(function CustomInput(
  { value, onClick, onChange, placeholderText },
  ref
) {
  return (
    <input
      ref={ref}
      type="text"
      value={value || ""}
      onClick={onClick}
      onFocus={onClick}
      onChange={onChange}
      readOnly
      inputMode="none"
      placeholder={placeholderText}
      className="custom-datepicker-input"
    />
  );
});

export default DateSelecter;
