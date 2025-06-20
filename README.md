# **Distance Measurer: A Full-Stack IoT Project**

## **Table of Contents**

* [Project Description](#bookmark=id.g26uoqxwao2s)  
* [Methodology](#bookmark=id.mrylrd40y78q)  
* [Technology Stack](#bookmark=id.iww3tgdde6ho)  
* [Final Product Showcase](#bookmark=id.egigxkgkgkma)  
* [How to Set Up and Run](#bookmark=id.l53rpub4udd0)  
* [Future Enhancements](#bookmark=id.h3nlfc0nu0l)  
* [Acknowledgements](#bookmark=id.u5rouzjahbwu)

## **Project Description**

The goal of this project is to design, build, and deploy a complete, end-to-end Internet of Things (IoT) system. The system centers around a physical device that measures the distance to an obstacle and communicates this data to a custom-built backend server.

The data is then stored in a persistent database and visualized in real-time on a dynamic web dashboard. Crucially, the system is interactive, allowing a user to remotely control the IoT device (turning it on or off) directly from the web interface, demonstrating a full feedback loop between the physical and digital worlds.

## **Methodology**

This project was built following a systematic full-stack development workflow:

1. **Hardware & Firmware:** An ESP32 microcontroller was programmed using the Arduino framework to interface with an HC-SR04 ultrasonic sensor for distance measurement and two 7-segment displays for local visual feedback. The firmware handles connecting to a WiFi network and sending HTTP requests to the backend.  
2. **Database Design:** A PostgreSQL database was designed with a single table (sensor\_data) to store time-series data, logging each measurement's distance, an associated detection state, and a precise timestamp.  
3. **Backend Development:** A lightweight backend server was built using Node.js and Express.js. It exposes a REST API with three core endpoints: one to receive and store data from the ESP32, one for the ESP32 to check its operational status, and one for the frontend to fetch historical data and send control commands.  
4. **Frontend Development:** A responsive, single-page web dashboard was created using vanilla HTML, CSS, and JavaScript. It polls the backend for data and uses Chart.js to render live, serial-plotter style graphs and data tables for an intuitive user experience.  
5. **Full-Stack Integration:** All components were integrated to communicate over a local network. This involved configuring the ESP32 with the server's IP address and enabling Cross-Origin Resource Sharing (CORS) on the backend to allow the frontend to make requests.

## **Technology Stack**

This project utilizes a wide range of hardware and software technologies:

* **Hardware:**  
  * ESP32 Development Board  
  * HC-SR04 Ultrasonic Sensor  
  * 2-Digit 7-Segment Display  
* **Firmware (C++/Arduino):**  
  * WiFi.h & HTTPClient.h for networking  
  * ArduinoJson for handling JSON data  
* **Backend:**  
  * Node.js (Runtime Environment)  
  * Express.js (Web Framework)  
  * node-postgres (pg) for database communication  
  * cors for handling cross-origin requests  
* **Database:**  
  * PostgreSQL  
* **Frontend:**  
  * HTML5  
  * CSS3 (with Flexbox & Grid)  
  * JavaScript (ES6+)  
  * **Chart.js** for data visualization

## **Final Product Showcase**

The final result is a clean, responsive web dashboard that provides a complete overview and control of the IoT device. It features live-updating graphs for both distance and detection status, alongside scrollable tables showing the historical data for each.

*A view of the complete dashboard, showing the live graphs and the history tables populated with data from the device.*

*A closer view of the live distance graph tracking an object and the corresponding history table.*

## **How to Set Up and Run**

Follow these steps to get the entire system running on your local network.

**Prerequisites:**

* Node.js and npm installed.  
* PostgreSQL server installed and running.  
* Arduino IDE installed with the ESP32 board manager.

**1\. Database Setup:**

* Create a PostgreSQL database (e.g., named Yarkom).  
* Run the following SQL query to create the necessary table:  
  CREATE TABLE sensor\_data (  
      id SERIAL PRIMARY KEY,  
      distance\_cm NUMERIC(5, 2\) NOT NULL,  
      led\_is\_on BOOLEAN NOT NULL,  
      created\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\_TIMESTAMP  
  );

**2\. Backend Setup:**

* Navigate to the backend project folder in your terminal.  
* Install dependencies: npm install express pg cors  
* Update the database credentials in server.js if necessary.  
* Start the server: node server.js

**3\. Hardware & Firmware Setup:**

* Connect the ESP32 and circuit components.  
* Open the Arduino code (.ino file).  
* Update the ssid, password, and serverIp variables to match your local network.  
* Upload the code to the ESP32.

**4\. Frontend Usage:**

* Open the frontend project folder.  
* Ensure the API\_URL variable in script.js matches your backend server's IP.  
* Open the index.html file in any modern web browser.

## **Future Enhancements**

While fully functional, the project could be extended with several advanced features:

* **Cloud Deployment:** Deploy the backend to a service like Heroku or Render and the database to a cloud provider (e.g., Supabase, ElephantSQL) to make the dashboard accessible from anywhere on the internet.  
* **WebSocket Communication:** Replace the frontend's HTTP polling with a WebSocket connection for more efficient, truly real-time data transfer from the server.  
* **User Authentication:** Add a login system to protect the dashboard and control functionality.  
* **Data Analytics:** Perform analysis on the collected data to find patterns, such as the most active times of day for detection.

## **Acknowledgements**

* This project was made possible by the robust open-source libraries provided by the **Node.js**, **PostgreSQL**, and **Chart.js** communities.  
* Credit to the developers of the various Arduino libraries that simplify hardware communication.