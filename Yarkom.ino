#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- WiFi & Server Configuration ---
const char* ssid = "";
const char* password = "";

const char* serverIp = ""; 
const int serverPort = 3000;

String systemStatus = "on"; 


const int segPins1[] = {2, 4, 5, 18, 19, 21, 22, 23}; 
const int segPins2[] = {25, 26, 27, 32, 33, 12, 13, 14}; 
// Ultrasonic Sensor
const int trigPin = 16;
const int echoPin = 17;
// LED
const int ledPin = 15;

// --- Digit Patterns (Same as before) ---
byte digitPatterns[] = {0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F};

// --- Measurement Variables (Same as before) ---
long duration;
float distanceCmFloat;
int distanceCmInt;
const int ledThreshold = 10;

// --- Function Prototypes for clarity ---
void connectToWiFi();
void checkSystemStatus();
void performMeasurementAndSendData();
void writeSegments(const int pinsArray[], byte digitPattern, boolean dpOn);
void displayNumber(int tensDigit, int unitsDigit, boolean showDecimalPoint);
void clearDisplay();

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 IoT Obstacle Detector");

  for (int i = 0; i < 8; i++) pinMode(segPins1[i], OUTPUT);
  for (int i = 0; i < 8; i++) pinMode(segPins2[i], OUTPUT);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(ledPin, OUTPUT);

  clearDisplay();
  connectToWiFi();
}

void loop() {
  checkSystemStatus();

  if (systemStatus == "on") {
    performMeasurementAndSendData();
  } else {
    Serial.println("System is OFF. Standing by.");
    clearDisplay();
    digitalWrite(ledPin, LOW); 
    delay(500); 
  }
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void checkSystemStatus() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String serverPath = "http://" + String(serverIp) + ":" + String(serverPort) + "/api/status";
    
    http.begin(serverPath);
    int httpResponseCode = http.GET();

    if (httpResponseCode > 0) {
      String payload = http.getString();
      Serial.print("Status check response: ");
      Serial.println(payload);

      JsonDocument doc;
      deserializeJson(doc, payload);
      systemStatus = doc["status"].as<String>();
    } else {
      Serial.print("Error on checking status. Code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("WiFi Disconnected. Cannot check status.");
    // Attempt to reconnect
    connectToWiFi();
  }
}

void performMeasurementAndSendData() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH, 50000); 
  distanceCmFloat = duration * 0.0343 / 2;
  
  if (distanceCmFloat <= 0) { 
    distanceCmFloat = 99; 
  }
  
  distanceCmInt = round(distanceCmFloat);
  Serial.printf("Raw Distance: %.2f cm, Rounded: %d cm\n", distanceCmFloat, distanceCmInt);

  bool ledState = (distanceCmInt < ledThreshold);
  digitalWrite(ledPin, ledState ? HIGH : LOW);

  if (distanceCmFloat >= 10.0) { 
    clearDisplay();
  } else {
    int tens = (int)distanceCmFloat; 
    int units = ((int)(distanceCmFloat * 10)) % 10; 
    displayNumber(tens, units, true);
  }

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String serverPath = "http://" + String(serverIp) + ":" + String(serverPort) + "/api/data";
    
    http.begin(serverPath);
    http.addHeader("Content-Type", "application/json");

    JsonDocument postDoc;
    postDoc["distance"] = distanceCmFloat;
    postDoc["led_state"] = ledState ? 1 : 0;
    
    String requestBody;
    serializeJson(postDoc, requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      String payload = http.getString();
      Serial.print("Data sent. Response: ");
      Serial.println(payload);
    } else {
      Serial.print("Error sending data. Code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("WiFi Disconnected. Could not send data.");
  }

  delay(2000); 
}

void writeSegments(const int pinsArray[], byte digitPattern, boolean dpOn) {
  for (int i = 0; i < 7; i++) {
    boolean segmentState = (digitPattern >> i) & 0x01;
    digitalWrite(pinsArray[i], segmentState);
  }
  digitalWrite(pinsArray[7], dpOn ? HIGH : LOW);
}

void displayNumber(int tensDigit, int unitsDigit, boolean showDecimalPoint) {
  if (tensDigit > 9) tensDigit = 9;
  if (unitsDigit > 9) unitsDigit = 9;
  writeSegments(segPins1, digitPatterns[tensDigit], showDecimalPoint);
  writeSegments(segPins2, digitPatterns[unitsDigit], false);
}

void clearDisplay() {
  for (int i = 0; i < 8; i++) {
    digitalWrite(segPins1[i], LOW);
    digitalWrite(segPins2[i], LOW);
  }
}