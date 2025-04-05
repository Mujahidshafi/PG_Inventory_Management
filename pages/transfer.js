import React, { useState } from "react";
//import "../App.css";
import Layout from "../components/layout";
import Selector from "../components/Selector";
import DateandTimePicker from "../components/DateandTimePicker";
import { format } from "date-fns";
import Button from "../components/button";

function Transfer() {
    const [selectedValue, setSelectedValue] = React.useState("");
    const [selectedValue1, setSelectedValue1] = React.useState("");
    const [dateTime, setDateTime] = useState("");

    let formattedDateTimeDisplay;

    if (dateTime) {
        formattedDateTimeDisplay = (
            <p className="mt-2">
                {format(new Date(dateTime), "MMMM d, yyyy 'at' h:mm a")}
            </p>
        );
    } else {
        formattedDateTimeDisplay = (
            <p className="mt-2 text-gray-500">Please select a date and time</p>
        );
    }
    return (
        <Layout title="Transfer">
            <span>Content
                <div className="absolute top-[300px] left-[70px] p-4">
                    <Selector
                        label = "From"
                        value={selectedValue}
                        onChange = {setSelectedValue}
                        options={[
                        { label: "Location1", value: "Location1" },
                        { label: "Location2", value: "Location2" },
                        { label: "Location3", value: "Location3" }]}
                    />
                    <p>Value: {selectedValue}</p>
                </div>
                <div className="absolute top-[300px] left-[250px] p-4">
                    <Selector
                        label = "From"
                        value={selectedValue1}
                        onChange = {setSelectedValue1}
                        options={[
                            { label: "Location1", value: "Location1" },
                            { label: "Location2", value: "Location2" },
                            { label: "Location3", value: "Location3" }]}
                    />
                    <p>Value: {selectedValue1}</p>
                </div>
                <div className="absolute top-[300px] left-[430px] p-4">
                    <label form="Weight" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Weight</label>
                    <input type="text" id="weight" className="bg-gray-50 border border-gray-300
                    text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5
                    dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="0lb" required />
                </div>
                <div className="absolute top-[300px] left-[620px] p-4">
                    <DateandTimePicker
                        label="Select Date & Time"
                        value={dateTime}
                        onChange={setDateTime}
                    />
                    {formattedDateTimeDisplay}
                </div>
                <div className="absolute top-[330px] left-[890px] p-4">
                    <Button
                        label = "Transfer"
                        Color = "red"
                        className = "min-w-[160px] h-10"
                    />
                </div>
            </span>
        </Layout>
    );
}

export default Transfer;