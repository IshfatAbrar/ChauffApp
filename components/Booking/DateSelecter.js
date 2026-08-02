import React, { useState, useContext, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DateSelecter.css";
import { TimeContext } from "../../context/TimeContext";

function DateSelecter() {
  const { time, setTime } = useContext(TimeContext);
  const [minSelectableTime, setMinSelectableTime] = useState(null);

  const calculateMinSelectableTime = () => {
    const now = new Date();
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    setMinSelectableTime(sixHoursFromNow);
  };

  const handleDateChange = (date) => {
    setTime(date);
  };

  const filterFutureTime = (time) => {
    const now = new Date();
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const selectedDate = new Date(time);
    return selectedDate.getTime() >= sixHoursFromNow.getTime();
  };

  useEffect(() => {
    calculateMinSelectableTime();
  }, []);

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
          onChange={handleDateChange}
          showTimeSelect
          isClearable={true}
          dateFormat="Pp"
          popperPlacement="bottom-end"
          withPortal={typeof window !== "undefined" && window.innerWidth < 768}
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
