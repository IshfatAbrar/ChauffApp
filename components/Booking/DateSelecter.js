import React, { useState, useContext, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DateSelecter.css";
import { TimeContext } from "@/context/TimeContext";

function DateSelecter() {
  const { time, setTime } = useContext(TimeContext);
  const [minSelectableTime, setMinSelectableTime] = useState(null);

  // Calculate minimum selectable time (6 hours from current time)
  const calculateMinSelectableTime = () => {
    const now = new Date();
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    setMinSelectableTime(sixHoursFromNow);
  };

  // Handle date change
  const handleDateChange = (date) => {
    setTime(date);
  };

  // Filter function to allow times at least 6 hours from now
  const filterFutureTime = (time) => {
    const now = new Date();
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const selectedDate = new Date(time);
    return selectedDate.getTime() >= sixHoursFromNow.getTime();
  };

  // Call function to calculate minimum selectable time on component mount
  useEffect(() => {
    calculateMinSelectableTime();
  }, []);

  return (
    <div>
      <div className="flex items-center">
        <h1>Pickup Time</h1>
        <div
          className="info-icon pl-2"
          title="You can only book six hours ahead"
        >
          <i class="fa-solid fa-circle-info"></i>
        </div>
      </div>
      <div className="customDatePickerWidth flex w-[100%] px-0">
        <DatePicker
          showIcon
          selected={time}
          onChange={handleDateChange}
          showTimeSelect
          isClearable={true}
          dateFormat="Pp"
          popperPlacement="bottom-end"
          className="custom-datepicker-input w-full"
          minDate={minSelectableTime} // Set minimum selectable date and time
          filterTime={filterFutureTime} // Filter times at least 6 hours from now
          customInput={<CustomInput placeholderText=" Pickup Time" />}
        />
      </div>
    </div>
  );
}

// Custom input component to display placeholder initially
const CustomInput = ({ value, onClick, placeholderText }) => (
  <input
    type="text"
    value={value ? value : ""}
    onClick={onClick}
    placeholder={placeholderText}
    className="custom-datepicker-input"
  />
);

export default DateSelecter;
