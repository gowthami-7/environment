import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./App.css";

import axios from "axios";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import {
  Activity,
  Droplets,
  Thermometer,
  CloudRain,
  ShieldAlert,
  Wifi,
  MapPin,
  Bell,
  Brain,
  AlertTriangle,
  Zap,
  Clock,
  Server,
  Radio,
  Play,
  RotateCcw,
  Target,
  Navigation,
  CheckCircle2,
  Siren,
  BarChart3,
} from "lucide-react";


const API_URL = "/api";


// =====================================================
// DEFAULT NODE STATE
// =====================================================

const defaultNodeState = {
  "NODE-01": {
    distance: 397,
    temperature: 29.6,
    humidity: 69,
    risk: "NORMAL",
    confidence: 99.4,
  },

  "NODE-02": {
    distance: 315,
    temperature: 30.2,
    humidity: 72,
    risk: "WARNING",
    confidence: 94.1,
  },

  "NODE-03": {
    distance: 265,
    temperature: 32.4,
    humidity: 81,
    risk: "CRITICAL",
    confidence: 97.8,
  },

  "NODE-04": {
    distance: 380,
    temperature: 29.4,
    humidity: 64,
    risk: "NORMAL",
    confidence: 98.9,
  },
};


function App() {

  // =====================================================
  // CURRENT SENSOR DATA
  // =====================================================

  const [distance, setDistance] =
    useState(397);

  const [temperature, setTemperature] =
    useState(29.6);

  const [humidity, setHumidity] =
    useState(69);

  const [rateChange, setRateChange] =
    useState(0);


  // =====================================================
  // DATABASE HISTORICAL SENSOR DATA
  // =====================================================

  const [distanceHistory, setDistanceHistory] =
    useState([]);

  const [temperatureHistory, setTemperatureHistory] =
    useState([]);

  const [humidityHistory, setHumidityHistory] =
    useState([]);


  // =====================================================
  // ML DATA
  // =====================================================

  const [mlRisk, setMlRisk] =
    useState("NORMAL");

  const [mlConfidence, setMlConfidence] =
    useState(0);


  // =====================================================
  // SYSTEM STATUS
  // =====================================================

  const [apiStatus, setApiStatus] =
    useState("CONNECTING");

  const [lastUpdated, setLastUpdated] =
    useState("--");


  // =====================================================
  // DEMO MODE
  // =====================================================

  const [demoMode, setDemoMode] =
    useState("LIVE");


  // =====================================================
  // NODE SELECTION
  // =====================================================

  const [selectedNode, setSelectedNode] =
    useState(null);


  // =====================================================
  // ALERT STATE
  // =====================================================

  const [alertAcknowledged, setAlertAcknowledged] =
    useState(false);


  // =====================================================
  // DATABASE ALERT HISTORY
  // =====================================================

  const [alertHistory, setAlertHistory] =
    useState([]);


  // =====================================================
  // PREVIOUS RISK
  // =====================================================

  const previousRiskRef =
    useRef("NORMAL");


  // =====================================================
  // MONITORING NODES
  // =====================================================

  const [nodes, setNodes] =
    useState([]);


  // =====================================================
  // RISK COLOR
  // =====================================================

  const getRiskColor = (risk) => {

    if (risk === "CRITICAL") {
      return "#ef4444";
    }

    if (risk === "WARNING") {
      return "#f59e0b";
    }

    return "#22c55e";
  };


  // =====================================================
  // RISK LABEL
  // =====================================================

  const getRiskLabel = (risk) => {

    if (risk === "CRITICAL") {
      return "CRITICAL";
    }

    if (risk === "WARNING") {
      return "WARNING";
    }

    return "NORMAL";
  };


  // =====================================================
  // DEMO PRESETS
  // =====================================================

  const demoPresets = {

    NORMAL: {
      distance: 390,
      temperature: 29.5,
      humidity: 66,
      rateChange: 2,
    },

    WARNING: {
      distance: 315,
      temperature: 31.2,
      humidity: 74,
      rateChange: -10,
    },

    CRITICAL: {
      distance: 260,
      temperature: 33.1,
      humidity: 84,
      rateChange: -18,
    },

  };


  // =====================================================
  // CHECK BACKEND CONNECTION
  // =====================================================

  const checkBackendConnection = async () => {

    try {

      await axios.get(
        `${API_URL}/`,
        {
          timeout: 3000,
        }
      );

      setApiStatus(
        "ONLINE"
      );

      return true;

    } catch (error) {

      console.error(
        "Backend connection unavailable:",
        error.message
      );

      setApiStatus(
        "OFFLINE"
      );

      return false;
    }
  };


  // =====================================================
  // LOAD NODES FROM DATABASE
  // =====================================================

  const loadNodes = async () => {

    try {

      const response =
        await axios.get(
          `${API_URL}/nodes`,
          {
            timeout: 5000,
          }
        );

      const databaseNodes =
        response.data.nodes ||
        [];


      const mergedNodes =
        databaseNodes.map(
          (databaseNode) => {

            const existing =
              defaultNodeState[
                databaseNode.id
              ] || {};


            return {

              id:
                databaseNode.id,

              location:
                databaseNode.location,

              distance:
                existing.distance ??
                397,

              temperature:
                existing.temperature ??
                29.6,

              humidity:
                existing.humidity ??
                69,

              risk:
                existing.risk ??
                "NORMAL",

              confidence:
                existing.confidence ??
                0,

              lat:
                Number(
                  databaseNode.latitude
                ),

              lng:
                Number(
                  databaseNode.longitude
                ),

              status:
                databaseNode.status ||
                "ONLINE",

            };
          }
        );


      setNodes(
        mergedNodes
      );


      setApiStatus(
        "ONLINE"
      );

    } catch (error) {

      console.error(
        "Node database error:",
        error.message
      );

      setApiStatus(
        "OFFLINE"
      );
    }
  };


  // =====================================================
  // LOAD HISTORICAL DATA
  // =====================================================

  const loadHistoricalData = async () => {

    try {

      const response =
        await axios.get(
          `${API_URL}/readings/NODE-01?limit=20`,
          {
            timeout: 5000,
          }
        );

      const readings =
        response.data.readings ||
        [];


      const orderedReadings =
        [
          ...readings,
        ].reverse();


      if (
        orderedReadings.length >
        0
      ) {

        setDistanceHistory(
          orderedReadings.map(
            (reading) =>
              Number(
                reading.distance_cm
              )
          )
        );


        setTemperatureHistory(
          orderedReadings.map(
            (reading) =>
              Number(
                reading.temperature_c
              )
          )
        );


        setHumidityHistory(
          orderedReadings.map(
            (reading) =>
              Number(
                reading.humidity_percent
              )
          )
        );
      }


      setApiStatus(
        "ONLINE"
      );

    } catch (error) {

      console.error(
        "Historical data error:",
        error.message
      );

      setApiStatus(
        "OFFLINE"
      );
    }
  };


  // =====================================================
  // LOAD ALERTS
  // =====================================================

  const loadAlerts = async () => {

    try {

      const response =
        await axios.get(
          `${API_URL}/alerts?limit=20`,
          {
            timeout: 5000,
          }
        );

      const alerts =
        response.data.alerts ||
        [];


      const formattedAlerts =
        alerts.map(
          (alert) => ({

            id:
              alert.id,

            time:
              new Date(
                alert.timestamp
              ).toLocaleTimeString(),

            node:
              alert.node_id,

            risk:
              alert.risk,

            message:
              alert.message ||
              "Environmental risk event detected.",

            acknowledged:
              Boolean(
                alert.acknowledged
              ),

          })
        );


      setAlertHistory(
        formattedAlerts
      );


      if (
        formattedAlerts.length >
        0
      ) {

        setAlertAcknowledged(
          formattedAlerts[0]
            .acknowledged
        );
      }

    } catch (error) {

      console.error(
        "Alert history error:",
        error.message
      );

      setApiStatus(
        "OFFLINE"
      );
    }
  };


  // =====================================================
  // INITIAL DATABASE LOAD
  // =====================================================

  useEffect(() => {

    const initializeDashboard =
      async () => {

        const connected =
          await checkBackendConnection();

        if (!connected) {
          return;
        }

        await loadNodes();

        await loadHistoricalData();

        await loadAlerts();
      };


    initializeDashboard();


    const connectionInterval =
      setInterval(
        () => {
          checkBackendConnection();
        },
        5000
      );


    const databaseInterval =
      setInterval(
        async () => {

          const connected =
            await checkBackendConnection();

          if (!connected) {
            return;
          }

          await loadNodes();

          await loadHistoricalData();

          await loadAlerts();

        },
        10000
      );


    return () => {

      clearInterval(
        connectionInterval
      );

      clearInterval(
        databaseInterval
      );

    };

  }, []);


  // =====================================================
  // RUN DEMO
  // =====================================================

  const runDemo =
    async (mode) => {

      setDemoMode(
        mode
      );

      setAlertAcknowledged(
        false
      );


      const preset =
        demoPresets[mode];


      setDistance(
        preset.distance
      );

      setTemperature(
        preset.temperature
      );

      setHumidity(
        preset.humidity
      );

      setRateChange(
        preset.rateChange
      );


      try {

        const response =
          await axios.post(
            `${API_URL}/predict`,
            {

              distance_cm:
                preset.distance,

              temperature_c:
                preset.temperature,

              humidity_percent:
                preset.humidity,

              rate_change_cm:
                preset.rateChange,

              node_id:
                "NODE-01",

            },
            {
              timeout: 5000,
            }
          );


        setApiStatus(
          "ONLINE"
        );


        setMlRisk(
          response.data.risk
        );


        setMlConfidence(
          response.data
            .confidence
        );


        setNodes(
          (oldNodes) =>
            oldNodes.map(
              (node) => {

                if (
                  node.id !==
                  "NODE-01"
                ) {

                  return node;
                }


                return {

                  ...node,

                  distance:
                    preset.distance,

                  temperature:
                    preset.temperature,

                  humidity:
                    preset.humidity,

                  risk:
                    response.data
                      .risk,

                  confidence:
                    response.data
                      .confidence,

                };
              }
            )
        );


        setLastUpdated(
          new Date()
            .toLocaleTimeString()
        );


        setSelectedNode({

          id:
            "NODE-01",

          location:
            "Central Monitoring Zone",

          distance:
            preset.distance,

          temperature:
            preset.temperature,

          humidity:
            preset.humidity,

          risk:
            response.data
              .risk,

          confidence:
            response.data
              .confidence,

          lat:
            13.0827,

          lng:
            80.2707,

          status:
            "ONLINE",

        });


        await loadHistoricalData();

        await loadAlerts();

      } catch (error) {

        setApiStatus(
          "OFFLINE"
        );

        console.error(
          "Demo prediction error:",
          error.message
        );
      }
    };


  // =====================================================
  // RESET DEMO
  // =====================================================

  const resetDemo =
    () => {

      setDemoMode(
        "LIVE"
      );

      setDistance(
        397
      );

      setTemperature(
        29.6
      );

      setHumidity(
        69
      );

      setRateChange(
        0
      );

      setMlRisk(
        "NORMAL"
      );

      setMlConfidence(
        0
      );

      setSelectedNode(
        null
      );

      setAlertAcknowledged(
        false
      );


      loadNodes();

      loadHistoricalData();

      loadAlerts();
    };


  // =====================================================
  // LIVE SENSOR SIMULATION
  // =====================================================

  useEffect(() => {

    if (
      demoMode !==
      "LIVE"
    ) {

      return;
    }


    const interval =
      setInterval(
        () => {

          setDistance(
            (previousDistance) => {

              const newDistance =
                Math.max(
                  250,

                  Math.min(
                    420,

                    previousDistance +
                      (
                        Math.random() -
                        0.5
                      ) *
                      5
                  )
                );


              const newRate =
                newDistance -
                previousDistance;


              setRateChange(
                newRate
              );


              return newDistance;

            }
          );


          setTemperature(
            (previousTemperature) => {

              const newTemperature =
                Number(
                  (
                    previousTemperature +
                    (
                      Math.random() -
                      0.5
                    ) *
                    0.4
                  ).toFixed(1)
                );


              return newTemperature;

            }
          );


          setHumidity(
            (previousHumidity) => {

              const newHumidity =
                Math.min(
                  100,

                  Math.max(
                    40,

                    Math.round(
                      previousHumidity +
                        (
                          Math.random() -
                          0.5
                        ) *
                        2
                    )
                  )
                );


              return newHumidity;

            }
          );

        },
        2000
      );


    return () =>
      clearInterval(
        interval
      );

  }, [demoMode]);


  // =====================================================
  // LIVE ML REQUEST
  // =====================================================

  useEffect(() => {

    if (
      demoMode !==
      "LIVE"
    ) {

      return;
    }


    if (
      apiStatus ===
      "OFFLINE"
    ) {

      return;
    }


    const timeout =
      setTimeout(
        async () => {

          try {

            const response =
              await axios.post(
                `${API_URL}/predict`,
                {

                  distance_cm:
                    distance,

                  temperature_c:
                    temperature,

                  humidity_percent:
                    humidity,

                  rate_change_cm:
                    rateChange,

                  node_id:
                    "NODE-01",

                },
                {
                  timeout: 5000,
                }
              );


            setMlRisk(
              response.data
                .risk
            );


            setMlConfidence(
              response.data
                .confidence
            );


            setApiStatus(
              "ONLINE"
            );


            setLastUpdated(
              new Date()
                .toLocaleTimeString()
            );


            setNodes(
              (oldNodes) =>
                oldNodes.map(
                  (node) => {

                    if (
                      node.id !==
                      "NODE-01"
                    ) {

                      return node;
                    }


                    return {

                      ...node,

                      distance:
                        Math.round(
                          distance
                        ),

                      temperature,

                      humidity,

                      risk:
                        response.data
                          .risk,

                      confidence:
                        response.data
                          .confidence,

                    };

                  }
                )
            );


            loadHistoricalData();

            loadAlerts();

          } catch (error) {

            setApiStatus(
              "OFFLINE"
            );

            console.error(
              "ML API connection error:",
              error.message
            );
          }

        },
        700
      );


    return () =>
      clearTimeout(
        timeout
      );

  }, [
    distance,
    temperature,
    humidity,
    rateChange,
    demoMode,
    apiStatus,
  ]);


  // =====================================================
  // ALERT ENGINE
  // =====================================================

  useEffect(() => {

    const currentRisk =
      mlRisk;

    const previousRisk =
      previousRiskRef.current;


    if (
      currentRisk ===
      previousRisk
    ) {

      return;
    }


    previousRiskRef.current =
      currentRisk;


    loadAlerts();

    setAlertAcknowledged(
      false
    );

  }, [mlRisk]);


  // =====================================================
  // WATER TREND
  // =====================================================

  const firstReading =
    distanceHistory.length >
    0
      ? distanceHistory[0]
      : distance;


  const latestReading =
    distanceHistory.length >
    0
      ? distanceHistory[
          distanceHistory.length -
            1
        ]
      : distance;


  const distanceChange =
    latestReading -
    firstReading;


  let waterTrend =
    "STABLE";


  if (
    distanceChange < -5
  ) {

    waterTrend =
      "RISING";

  } else if (
    distanceChange > 5
  ) {

    waterTrend =
      "FALLING";

  }


  // =====================================================
  // CURRENT RISK
  // =====================================================

  const risk =
    mlRisk === "CRITICAL"
      ? "CRITICAL"
      : mlRisk === "WARNING"
      ? "WARNING"
      : "LOW";


  const riskClass =
    risk === "CRITICAL"
      ? "critical"
      : risk === "WARNING"
      ? "warning"
      : "low";


  const riskPercentage =
    mlConfidence > 0
      ? Math.round(
          mlConfidence
        )
      : 20;


  // =====================================================
  // ANOMALY
  // =====================================================

  let anomalyStatus =
    "NORMAL";


  if (
    risk === "CRITICAL"
  ) {

    anomalyStatus =
      "ANOMALY DETECTED";

  } else if (
    risk === "WARNING"
  ) {

    anomalyStatus =
      "WATCH";

  }


  // =====================================================
  // ALERT MESSAGE
  // =====================================================

  let alertMessage =
    "Environmental conditions are currently normal.";


  if (
    risk === "WARNING"
  ) {

    alertMessage =
      "Elevated environmental risk detected. Continue close monitoring.";

  } else if (
    risk === "CRITICAL"
  ) {

    alertMessage =
      "Critical environmental risk detected. Immediate monitoring required.";

  }


  // =====================================================
  // NODE COUNTS
  // =====================================================

  const normalNodes =
    useMemo(
      () =>
        nodes.filter(
          (node) =>
            node.risk ===
            "NORMAL"
        ).length,
      [nodes]
    );


  const warningNodes =
    useMemo(
      () =>
        nodes.filter(
          (node) =>
            node.risk ===
            "WARNING"
        ).length,
      [nodes]
    );


  const criticalNodes =
    useMemo(
      () =>
        nodes.filter(
          (node) =>
            node.risk ===
            "CRITICAL"
        ).length,
      [nodes]
    );


  // =====================================================
  // ACTIVE ALERT
  // =====================================================

  const activeAlert =
    useMemo(
      () => {

        if (
          risk === "LOW"
        ) {

          return null;
        }


        return {

          node:
            "NODE-01",

          location:
            "Central Monitoring Zone",

          risk,

          confidence:
            mlConfidence,

          time:
            lastUpdated,

          message:
            alertMessage,

        };

      },
      [
        risk,
        mlConfidence,
        lastUpdated,
        alertMessage,
      ]
    );


  // =====================================================
  // ACKNOWLEDGE DATABASE ALERT
  // =====================================================

  const handleAcknowledgeAlert =
    async () => {

      try {

        const latestAlert =
          alertHistory.length >
          0
            ? alertHistory[0]
            : null;


        if (
          !latestAlert ||
          !latestAlert.id
        ) {

          setAlertAcknowledged(
            true
          );

          return;
        }


        await axios.put(
          `${API_URL}/alerts/${latestAlert.id}/acknowledge`,
          {},
          {
            timeout: 5000,
          }
        );


        setAlertAcknowledged(
          true
        );


        await loadAlerts();

      } catch (error) {

        console.error(
          "Alert acknowledgement error:",
          error.message
        );
      }
    };


  // =====================================================
  // MAP SUMMARY
  // =====================================================

  const mapSummary =
    useMemo(
      () => ({
        total:
          nodes.length,

        normal:
          normalNodes,

        warning:
          warningNodes,

        critical:
          criticalNodes,
      }),
      [
        nodes.length,
        normalNodes,
        warningNodes,
        criticalNodes,
      ]
    );


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="app">


      {/* =================================================
          HEADER
          ================================================= */}

      <header className="header">


        <div className="brand-row">


          <div className="brand-icon">

            <ShieldAlert
              size={25}
            />

          </div>


          <div>

            <h1>
              Environmental Intelligence Network
            </h1>


            <p>
              AI-Powered Disaster Monitoring &
              Early Warning System
            </p>

          </div>


        </div>


        <div className="system-status">

          <span
            className={`status-dot ${
              apiStatus ===
              "OFFLINE"
                ? "offline"
                : apiStatus ===
                  "CONNECTING"
                ? "connecting"
                : ""
            }`}
          ></span>


          {apiStatus ===
          "OFFLINE"
            ? "SYSTEM OFFLINE"
            : apiStatus ===
              "CONNECTING"
            ? "CONNECTING"
            : "SYSTEM ONLINE"}

        </div>


      </header>



      {/* =================================================
          OFFLINE BANNER
          ================================================= */}

      {apiStatus ===
        "OFFLINE" && (

        <div className="offline-banner">

          <Wifi
            size={19}
          />

          <div>

            <strong>
              Backend connection lost
            </strong>

            <span>
              FastAPI is currently unavailable. The dashboard will automatically retry the connection.
            </span>

          </div>

        </div>

      )}



      {apiStatus ===
        "CONNECTING" && (

        <div className="offline-banner">

          <Radio
            size={19}
          />

          <div>

            <strong>
              Connecting to monitoring backend
            </strong>

            <span>
              Establishing communication with the FastAPI service...
            </span>

          </div>

        </div>

      )}



      <main className="dashboard">


        {/* =================================================
            HERO
            ================================================= */}

        <section className="hero-section">


          <div>


            <p className="eyebrow">
              NATIONAL ENVIRONMENTAL MONITORING
            </p>


            <h2>
              Proactive intelligence.
              <br />
              Faster disaster response.
            </h2>


            <p className="hero-text">

              Continuous environmental monitoring,
              machine-learning risk inference and
              prioritized early warning.

            </p>


          </div>


          <div className="hero-status">


            <div className="hero-status-icon">

              <Brain
                size={28}
              />

            </div>


            <div>

              <span>
                AI MODEL
              </span>


              <strong>
                RANDOM FOREST
              </strong>


              <small>
                Backend inference active
              </small>


            </div>


          </div>


        </section>



        {/* =================================================
            METRICS
            ================================================= */}

        <section className="metric-grid">


          <div className="metric-card">

            <span>

              <Server
                size={17}
              />

              ACTIVE NODES

            </span>


            <strong>
              {nodes.length}
            </strong>


            <small>
              Distributed monitoring network
            </small>


          </div>


          <div className="metric-card">

            <span>

              <ShieldAlert
                size={17}
              />

              NORMAL

            </span>


            <strong>
              {normalNodes}
            </strong>


            <small>
              Stable monitoring zones
            </small>


          </div>


          <div className="metric-card">

            <span>

              <AlertTriangle
                size={17}
              />

              WARNING

            </span>


            <strong>
              {warningNodes}
            </strong>


            <small>
              Elevated-risk zones
            </small>


          </div>


          <div className="metric-card">

            <span>

              <Siren
                size={17}
              />

              CRITICAL

            </span>


            <strong>
              {criticalNodes}
            </strong>


            <small>
              Immediate attention required
            </small>


          </div>


        </section>



        {/* =================================================
            DEMO CONTROL
            ================================================= */}

        <section className="simulation-panel">


          <div className="simulation-title">


            <Play
              size={19}
            />


            <div>

              <h2>
                Demo Simulation Control
              </h2>


              <p>
                Demonstrate the disaster escalation workflow.
              </p>

            </div>


          </div>


          <div className="simulation-controls">


            <button
              type="button"
              className={
                demoMode ===
                "NORMAL"
                  ? "simulation-btn active-normal"
                  : "simulation-btn"
              }
              onClick={() =>
                runDemo(
                  "NORMAL"
                )
              }
            >

              <span className="control-dot normal-dot"></span>

              NORMAL

            </button>


            <button
              type="button"
              className={
                demoMode ===
                "WARNING"
                  ? "simulation-btn active-warning"
                  : "simulation-btn"
              }
              onClick={() =>
                runDemo(
                  "WARNING"
                )
              }
            >

              <span className="control-dot warning-dot"></span>

              WARNING

            </button>


            <button
              type="button"
              className={
                demoMode ===
                "CRITICAL"
                  ? "simulation-btn active-critical"
                  : "simulation-btn"
              }
              onClick={() =>
                runDemo(
                  "CRITICAL"
                )
              }
            >

              <span className="control-dot critical-dot"></span>

              CRITICAL

            </button>


            <button
              type="button"
              className="reset-btn"
              onClick={
                resetDemo
              }
            >

              <RotateCcw
                size={16}
              />

              LIVE

            </button>


          </div>


        </section>



        {/* =================================================
            ACTIVE ALERT CENTER
            ================================================= */}

        <section
          className={`alert-center ${
            activeAlert
              ? riskClass
              : "safe"
          }`}
        >


          <div className="alert-center-header">


            <div className="alert-center-title">


              <div className="alert-center-icon">

                {activeAlert
                  ? <Siren
                      size={24}
                    />
                  : <CheckCircle2
                      size={24}
                    />}

              </div>


              <div>

                <p>
                  {activeAlert
                    ? "ACTIVE THREAT DETECTION"
                    : "THREAT MONITORING"}
                </p>


                <h2>

                  {activeAlert
                    ? `${activeAlert.risk} ALERT`
                    : "NO ACTIVE THREAT"}

                </h2>

              </div>


            </div>


            <div className="alert-priority">

              {activeAlert
                ? activeAlert.risk ===
                  "CRITICAL"
                  ? "PRIORITY 1"
                  : "PRIORITY 2"
                : "MONITORING"}

            </div>


          </div>


          {activeAlert ? (

            <div className="active-alert-content">


              <div className="alert-main-message">


                <div>

                  <span>
                    MONITORING NODE
                  </span>


                  <strong>
                    {activeAlert.node}
                  </strong>


                  <small>
                    {activeAlert.location}
                  </small>

                </div>


                <div className="alert-message-box">

                  <AlertTriangle
                    size={19}
                  />

                  <p>
                    {activeAlert.message}
                  </p>

                </div>


              </div>


              <div className="alert-data-grid">


                <div>

                  <span>
                    MODEL CONFIDENCE
                  </span>

                  <strong>
                    {activeAlert.confidence.toFixed(
                      1
                    )}%
                  </strong>

                </div>


                <div>

                  <span>
                    DETECTION TIME
                  </span>

                  <strong>
                    {activeAlert.time}
                  </strong>

                </div>


                <div>

                  <span>
                    RESPONSE STATUS
                  </span>

                  <strong>
                    {alertAcknowledged
                      ? "ACKNOWLEDGED"
                      : "ACTION REQUIRED"}
                  </strong>

                </div>


              </div>


              <div className="alert-actions">


                <button
                  type="button"
                  className="alert-action primary-action"
                  onClick={() =>
                    setSelectedNode(
                      nodes.find(
                        (node) =>
                          node.id ===
                          "NODE-01"
                      )
                    )
                  }
                >

                  <MapPin
                    size={16}
                  />

                  VIEW NODE

                </button>


                <button
                  type="button"
                  className="alert-action"
                  onClick={
                    handleAcknowledgeAlert
                  }
                  disabled={
                    alertAcknowledged
                  }
                >

                  <CheckCircle2
                    size={16}
                  />

                  {alertAcknowledged
                    ? "ACKNOWLEDGED"
                    : "ACKNOWLEDGE ALERT"}

                </button>


              </div>


            </div>

          ) : (

            <div className="safe-alert-content">


              <CheckCircle2
                size={21}
              />


              <div>

                <strong>
                  All monitored conditions are within the current prototype safety range.
                </strong>


                <p>
                  The monitoring network is actively evaluating incoming sensor data.
                </p>


              </div>


            </div>

          )}


        </section>



        {/* =================================================
            CURRENT RISK + LIVE INPUTS
            ================================================= */}

        <section className="main-risk-layout">


          <div
            className={`risk-panel ${riskClass}`}
          >


            <div className="risk-header">


              <div>

                <p>
                  CURRENT THREAT LEVEL
                </p>


                <h2>
                  Flood Risk
                </h2>


              </div>


              <div className="risk-icon">

                <ShieldAlert
                  size={30}
                />

              </div>


            </div>


            <div className="risk-value">

              {risk}

            </div>


            <p className="risk-description">

              {alertMessage}

            </p>


            <div className="risk-score">


              <div className="score-header">

                <span>
                  Model Confidence
                </span>


                <strong>
                  {riskPercentage}%
                </strong>

              </div>


              <div className="score-bar">


                <div
                  className="score-fill"
                  style={{
                    width:
                      `${riskPercentage}%`,
                  }}
                ></div>


              </div>


            </div>


          </div>


          <div className="panel sensor-live-panel">


            <div className="panel-title">


              <div>

                <h2>
                  Live Sensor Inputs
                </h2>


                <p>
                  Current values used by the ML model
                </p>


              </div>


              <Activity />

            </div>


            <div className="sensor-live-grid">


              <div className="live-value">

                <Droplets />

                <span>
                  Water Distance
                </span>


                <strong>

                  {distance.toFixed(0)}

                  <small>
                    {" "}cm
                  </small>

                </strong>

              </div>


              <div className="live-value">

                <Thermometer />

                <span>
                  Temperature
                </span>


                <strong>

                  {temperature}

                  <small>
                    {" "}°C
                  </small>

                </strong>

              </div>


              <div className="live-value">

                <CloudRain />

                <span>
                  Humidity
                </span>


                <strong>

                  {humidity}

                  <small>
                    {" "}%
                  </small>

                </strong>

              </div>


              <div className="live-value">

                <Activity />

                <span>
                  Distance Change
                </span>


                <strong>

                  {rateChange.toFixed(1)}

                  <small>
                    {" "}cm
                  </small>

                </strong>

              </div>


            </div>


          </div>


        </section>



        {/* =================================================
            NETWORK STATUS
            ================================================= */}

        <section className="panel">


          <div className="panel-title">


            <div>

              <h2>
                Network Status
              </h2>


              <p>
                Environmental monitoring infrastructure
              </p>


            </div>


            <Server />

          </div>


          <div className="edge-trend">


            <div>

              <Radio />

              <span>
                API Status
              </span>


              <strong>
                {apiStatus}
              </strong>


            </div>


            <div>

              <Clock />

              <span>
                Last Update
              </span>


              <strong>
                {lastUpdated}
              </strong>


            </div>


            <div>

              <Wifi />

              <span>
                Monitoring Nodes
              </span>


              <strong>
                {nodes.length}
              </strong>


            </div>


          </div>


        </section>



        {/* =================================================
            HISTORICAL SENSOR TRENDS
            ================================================= */}

        <section className="panel history-panel">


          <div className="panel-title">


            <div>

              <h2>
                Historical Sensor Trends
              </h2>


              <p>
                Recent environmental measurements retrieved from the monitoring database
              </p>


            </div>


            <BarChart3 />

          </div>


          <div className="history-grid">


            {/* WATER */}

            <div className="history-card">


              <div className="history-card-header">


                <div>

                  <span>
                    WATER DISTANCE
                  </span>


                  <strong>

                    {distanceHistory.length >
                    0
                      ? distanceHistory[
                          distanceHistory.length -
                            1
                        ].toFixed(0)
                      : distance.toFixed(0)}

                    {" "}cm

                  </strong>

                </div>


                <Droplets />

              </div>


              <div className="history-bars">


                {distanceHistory.length >
                0 ? (

                  distanceHistory.map(
                    (value, index) => (

                      <div
                        className="history-bar water-bar"
                        key={index}
                        style={{
                          height:
                            `${Math.max(
                              16,
                              (420 -
                                value) /
                                2.4 +
                                18
                            )}px`,
                        }}
                      ></div>

                    )
                  )

                ) : (

                  <div className="history-loading">
                    Loading database...
                  </div>

                )}

              </div>


              <div className="history-footer">

                <span>
                  Older
                </span>

                <span>
                  Recent
                </span>

              </div>


            </div>



            {/* TEMPERATURE */}

            <div className="history-card">


              <div className="history-card-header">


                <div>

                  <span>
                    TEMPERATURE
                  </span>


                  <strong>

                    {temperatureHistory.length >
                    0
                      ? temperatureHistory[
                          temperatureHistory.length -
                            1
                        ].toFixed(1)
                      : temperature.toFixed(1)}

                    {" "}°C

                  </strong>

                </div>


                <Thermometer />

              </div>


              <div className="history-bars">


                {temperatureHistory.length >
                0 ? (

                  temperatureHistory.map(
                    (value, index) => (

                      <div
                        className="history-bar temperature-bar"
                        key={index}
                        style={{
                          height:
                            `${Math.max(
                              18,
                              (value -
                                20) *
                                6
                            )}px`,
                        }}
                      ></div>

                    )
                  )

                ) : (

                  <div className="history-loading">
                    Loading database...
                  </div>

                )}

              </div>


              <div className="history-footer">

                <span>
                  Older
                </span>

                <span>
                  Recent
                </span>

              </div>


            </div>



            {/* HUMIDITY */}

            <div className="history-card">


              <div className="history-card-header">


                <div>

                  <span>
                    HUMIDITY
                  </span>


                  <strong>

                    {humidityHistory.length >
                    0
                      ? humidityHistory[
                          humidityHistory.length -
                            1
                        ]
                      : humidity}

                    {" "}%

                  </strong>

                </div>


                <CloudRain />

              </div>


              <div className="history-bars">


                {humidityHistory.length >
                0 ? (

                  humidityHistory.map(
                    (value, index) => (

                      <div
                        className="history-bar humidity-bar"
                        key={index}
                        style={{
                          height:
                            `${Math.max(
                              18,
                              value *
                                1.45
                            )}px`,
                        }}
                      ></div>

                    )
                  )

                ) : (

                  <div className="history-loading">
                    Loading database...
                  </div>

                )}

              </div>


              <div className="history-footer">

                <span>
                  Older
                </span>

                <span>
                  Recent
                </span>

              </div>


            </div>


          </div>


          <div className="history-note">

            <Activity
              size={15}
            />

            <span>
              Historical values are retrieved from SQLite through the FastAPI backend.
            </span>

          </div>


        </section>



        {/* =================================================
            MONITORING NODES
            ================================================= */}

        <section className="panel">


          <div className="panel-title">


            <div>

              <h2>
                Monitoring Nodes
              </h2>


              <p>
                Node identities and locations loaded from the monitoring database
              </p>


            </div>


            <Target />

          </div>


          <div className="node-grid">


            {nodes.length >
            0 ? (

              nodes.map(
                (node) => (

                  <button

                    type="button"

                    className={`node-card ${
                      node.risk.toLowerCase()
                    }`}

                    key={
                      node.id
                    }

                    onClick={() =>
                      setSelectedNode(
                        node
                      )
                    }

                  >


                    <div className="node-card-top">


                      <div>

                        <span>
                          {node.id}
                        </span>


                        <small>
                          {node.location}
                        </small>

                      </div>


                      <span className="node-status-dot"></span>


                    </div>


                    <strong className="node-risk">

                      {getRiskLabel(
                        node.risk
                      )}

                    </strong>


                    <div className="node-details">


                      <span>

                        Distance

                        <b>
                          {node.distance}
                          {" "}cm
                        </b>

                      </span>


                      <span>

                        Temperature

                        <b>
                          {node.temperature}
                          {" "}°C
                        </b>

                      </span>


                      <span>

                        Humidity

                        <b>
                          {node.humidity}%
                        </b>

                      </span>


                      <span>

                        ML Confidence

                        <b>
                          {node.confidence.toFixed(
                            1
                          )}%
                        </b>

                      </span>


                    </div>


                  </button>

                )
              )

            ) : (

              <div className="safe-alert-content">

                <Radio
                  size={21}
                />

                <div>

                  <strong>
                    Loading monitoring nodes...
                  </strong>

                  <p>
                    Retrieving node information from the backend.
                  </p>

                </div>

              </div>

            )}


          </div>


        </section>



        {/* =================================================
            NODE INTELLIGENCE
            ================================================= */}

        {selectedNode && (

          <section className="panel node-detail-panel">


            <div className="panel-title">


              <div>

                <h2>
                  Node Intelligence
                </h2>


                <p>
                  Detailed environmental status
                </p>


              </div>


              <button

                type="button"

                className="reset-btn"

                onClick={() =>
                  setSelectedNode(
                    null
                  )
                }

              >

                Close

              </button>


            </div>


            <div className="selected-node-layout">


              <div className="selected-node-main">


                <div className="selected-node-heading">


                  <div className="selected-node-icon">

                    <MapPin
                      size={24}
                    />

                  </div>


                  <div>

                    <h3>
                      {selectedNode.id}
                    </h3>

                    <p>
                      {selectedNode.location}
                    </p>

                  </div>


                </div>


                <div
                  className={`selected-risk ${
                    selectedNode.risk.toLowerCase()
                  }`}
                >

                  {selectedNode.risk}

                </div>


                <p className="selected-description">

                  This monitoring node is
                  reporting environmental
                  measurements to the network.

                </p>


              </div>


              <div className="selected-node-data">


                <div>

                  <span>
                    Water Distance
                  </span>

                  <strong>
                    {selectedNode.distance}
                    {" "}cm
                  </strong>

                </div>


                <div>

                  <span>
                    Temperature
                  </span>

                  <strong>
                    {selectedNode.temperature}
                    {" "}°C
                  </strong>

                </div>


                <div>

                  <span>
                    Humidity
                  </span>

                  <strong>
                    {selectedNode.humidity}%
                  </strong>

                </div>


                <div>

                  <span>
                    Model Confidence
                  </span>

                  <strong>
                    {selectedNode.confidence.toFixed(
                      1
                    )}%
                  </strong>

                </div>


              </div>


              <div className="selected-location">


                <Navigation
                  size={18}
                />


                <div>

                  <span>
                    MONITORING COORDINATES
                  </span>


                  <strong>

                    {selectedNode.lat.toFixed(
                      4
                    )}

                    {", "}

                    {selectedNode.lng.toFixed(
                      4
                    )}

                  </strong>

                </div>


              </div>


            </div>


          </section>

        )}



        {/* =================================================
            REGIONAL RISK MAP
            ================================================= */}

        <section className="map-panel">


          <div className="panel-title">


            <div>

              <h2>
                Regional Risk Map
              </h2>


              <p>
                Prototype monitoring locations • Select a node for detailed intelligence
              </p>


            </div>


            <MapPin />

          </div>



          {/* MAP SUMMARY */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(0, 1fr))",
              gap: "12px",
              marginBottom: "14px",
            }}
          >

            <div
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                background:
                  "rgba(34,197,94,0.08)",
                border:
                  "1px solid rgba(34,197,94,0.2)",
              }}
            >

              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  opacity: 0.7,
                  letterSpacing:
                    "0.08em",
                }}
              >
                TOTAL NODES
              </span>

              <strong
                style={{
                  display: "block",
                  fontSize: "20px",
                  marginTop: "4px",
                }}
              >
                {mapSummary.total}
              </strong>

            </div>


            <div
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                background:
                  "rgba(34,197,94,0.08)",
                border:
                  "1px solid rgba(34,197,94,0.2)",
              }}
            >

              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  opacity: 0.7,
                  letterSpacing:
                    "0.08em",
                }}
              >
                NORMAL
              </span>

              <strong
                style={{
                  display: "block",
                  fontSize: "20px",
                  marginTop: "4px",
                }}
              >
                {mapSummary.normal}
              </strong>

            </div>


            <div
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                background:
                  "rgba(245,158,11,0.08)",
                border:
                  "1px solid rgba(245,158,11,0.2)",
              }}
            >

              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  opacity: 0.7,
                  letterSpacing:
                    "0.08em",
                }}
              >
                WARNING
              </span>

              <strong
                style={{
                  display: "block",
                  fontSize: "20px",
                  marginTop: "4px",
                }}
              >
                {mapSummary.warning}
              </strong>

            </div>


            <div
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                background:
                  "rgba(239,68,68,0.08)",
                border:
                  "1px solid rgba(239,68,68,0.2)",
              }}
            >

              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  opacity: 0.7,
                  letterSpacing:
                    "0.08em",
                }}
              >
                CRITICAL
              </span>

              <strong
                style={{
                  display: "block",
                  fontSize: "20px",
                  marginTop: "4px",
                }}
              >
                {mapSummary.critical}
              </strong>

            </div>

          </div>



          {/* MAP LEGEND */}

          <div className="map-legend">


            <span>

              <i className="legend-dot normal-dot"></i>

              Normal

            </span>


            <span>

              <i className="legend-dot warning-dot"></i>

              Warning

            </span>


            <span>

              <i className="legend-dot critical-dot"></i>

              Critical

            </span>


            <span
              style={{
                marginLeft: "auto",
                opacity: 0.65,
                fontSize: "12px",
              }}
            >
              Prototype coordinates
            </span>


          </div>



          {/* MAP */}

          <div
            className="real-map"
            style={{
              position: "relative",
              overflow: "hidden",
            }}
          >

            <MapContainer

              center={[
                13.0827,
                80.2707,
              ]}

              zoom={12}

              style={{
                height: "430px",
                width: "100%",
              }}

            >

              <TileLayer

                attribution="&copy; OpenStreetMap contributors"

                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

              />


              {nodes.map(
                (node) => {

                  const nodeColor =
                    getRiskColor(
                      node.risk
                    );

                  const isSelected =
                    selectedNode?.id ===
                    node.id;


                  return (

                    <div
                      key={
                        `${node.id}-map`
                      }
                    >

                      {/* OUTER RISK GLOW */}

                      <CircleMarker

                        center={[
                          node.lat,
                          node.lng,
                        ]}

                        radius={
                          isSelected
                            ? 23
                            : node.risk ===
                              "CRITICAL"
                            ? 20
                            : 17
                        }

                        pathOptions={{

                          color:
                            nodeColor,

                          fillColor:
                            nodeColor,

                          fillOpacity:
                            isSelected
                              ? 0.12
                              : 0.10,

                          opacity:
                            0.45,

                          weight:
                            isSelected
                              ? 3
                              : 2,

                        }}

                      />


                      {/* MAIN NODE MARKER */}

                      <CircleMarker

                        center={[
                          node.lat,
                          node.lng,
                        ]}

                        radius={
                          isSelected
                            ? 12
                            : 8
                        }

                        eventHandlers={{
                          click: () =>
                            setSelectedNode(
                              node
                            ),
                        }}

                        pathOptions={{

                          color:
                            "#ffffff",

                          fillColor:
                            nodeColor,

                          fillOpacity:
                            0.95,

                          weight:
                            isSelected
                              ? 4
                              : 2,

                        }}

                      >

                        <Popup>

                          <div
                            style={{
                              minWidth:
                                "200px",
                              fontFamily:
                                "Arial, sans-serif",
                            }}
                          >

                            <div
                              style={{
                                display:
                                  "flex",
                                justifyContent:
                                  "space-between",
                                alignItems:
                                  "center",
                                gap:
                                  "12px",
                                marginBottom:
                                  "8px",
                              }}
                            >

                              <strong
                                style={{
                                  fontSize:
                                    "16px",
                                }}
                              >
                                {node.id}
                              </strong>

                              <span
                                style={{
                                  padding:
                                    "3px 7px",
                                  borderRadius:
                                    "999px",
                                  background:
                                    nodeColor,
                                  color:
                                    "#ffffff",
                                  fontSize:
                                    "10px",
                                  fontWeight:
                                    "700",
                                }}
                              >
                                {getRiskLabel(
                                  node.risk
                                )}
                              </span>

                            </div>


                            <div
                              style={{
                                fontSize:
                                  "12px",
                                marginBottom:
                                  "9px",
                              }}
                            >
                              {node.location}
                            </div>


                            <div
                              style={{
                                display:
                                  "grid",
                                gap:
                                  "5px",
                                fontSize:
                                  "12px",
                              }}
                            >

                              <div>
                                <strong>
                                  Status:
                                </strong>
                                {" "}
                                {node.status}
                              </div>

                              <div>
                                <strong>
                                  Water Distance:
                                </strong>
                                {" "}
                                {node.distance}
                                {" "}cm
                              </div>

                              <div>
                                <strong>
                                  Temperature:
                                </strong>
                                {" "}
                                {node.temperature}
                                {" "}°C
                              </div>

                              <div>
                                <strong>
                                  Humidity:
                                </strong>
                                {" "}
                                {node.humidity}%
                              </div>

                              <div>
                                <strong>
                                  ML Confidence:
                                </strong>
                                {" "}
                                {node.confidence.toFixed(
                                  1
                                )}%
                              </div>

                              <div>
                                <strong>
                                  Coordinates:
                                </strong>
                                <br />
                                {node.lat.toFixed(
                                  4
                                )}
                                {", "}
                                {node.lng.toFixed(
                                  4
                                )}
                              </div>

                            </div>


                          </div>

                        </Popup>


                      </CircleMarker>


                    </div>

                  );

                }
              )}


            </MapContainer>



            {/* MAP OVERLAY */}

            <div
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                zIndex: 1000,
                padding:
                  "10px 12px",
                borderRadius:
                  "12px",
                background:
                  "rgba(10,15,30,0.88)",
                border:
                  "1px solid rgba(255,255,255,0.12)",
                backdropFilter:
                  "blur(10px)",
                color:
                  "#ffffff",
                minWidth:
                  "170px",
                pointerEvents:
                  "none",
              }}
            >

              <div
                style={{
                  fontSize:
                    "10px",
                  letterSpacing:
                    "0.1em",
                  opacity:
                    0.65,
                  marginBottom:
                    "5px",
                }}
              >
                NETWORK MAP
              </div>

              <strong
                style={{
                  fontSize:
                    "14px",
                }}
              >
                {mapSummary.total} monitoring nodes
              </strong>

              <div
                style={{
                  marginTop:
                    "7px",
                  fontSize:
                    "11px",
                  lineHeight:
                    "1.6",
                }}
              >

                <div>
                  ● Normal: {mapSummary.normal}
                </div>

                <div>
                  ● Warning: {mapSummary.warning}
                </div>

                <div>
                  ● Critical: {mapSummary.critical}
                </div>

              </div>

            </div>


          </div>


          <div
            style={{
              marginTop: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              opacity: 0.65,
            }}
          >

            <Navigation
              size={14}
            />

            <span>
              Map positions currently represent prototype/demo monitoring locations. Actual deployment coordinates can be loaded from hardware/GPS during integration.
            </span>

          </div>


        </section>



        {/* =================================================
            ALERT HISTORY
            ================================================= */}

        <section className="panel">


          <div className="panel-title">


            <div>

              <h2>
                Alert History
              </h2>


              <p>
                Alerts retrieved from the monitoring database
              </p>


            </div>


            <Bell />

          </div>


          <div className="alert-history-list">


            {alertHistory.length >
            0 ? (

              alertHistory.map(
                (
                  alert,
                  index
                ) => (

                  <div

                    className={`alert-item ${
                      alert.risk ===
                      "CRITICAL"
                        ? "critical"
                        : alert.risk ===
                          "WARNING"
                        ? "warning"
                        : "low"
                    }`}

                    key={`${alert.id}-${index}`}

                  >


                    <span className="alert-icon">


                      {alert.risk ===
                      "NORMAL"
                        ? <ShieldAlert />
                        : <AlertTriangle />}


                    </span>


                    <div>


                      <strong>

                        {alert.risk}

                        {" • "}

                        {alert.node}

                      </strong>


                      <p>
                        {alert.message}
                      </p>


                      <small>

                        {alert.time}

                        {alert.acknowledged
                          ? " • ACKNOWLEDGED"
                          : ""}

                      </small>


                    </div>


                  </div>

                )
              )

            ) : (

              <div className="safe-alert-content">


                <CheckCircle2
                  size={21}
                />


                <div>

                  <strong>
                    No stored alerts
                  </strong>


                  <p>
                    The database currently contains no warning or critical events.
                  </p>


                </div>


              </div>

            )}


          </div>


        </section>



        {/* =================================================
            AI INTELLIGENCE
            ================================================= */}

        <section className="panel">


          <div className="panel-title">


            <div>

              <h2>
                AI Intelligence
              </h2>


              <p>
                Machine-learning based environmental analysis
              </p>


            </div>


            <Brain />

          </div>


          <div className="ai-grid">


            <div className="ai-card">

              <Brain />

              <span>
                AI Engine
              </span>


              <strong>
                RANDOM FOREST
              </strong>


            </div>


            <div className="ai-card">

              <Activity />

              <span>
                Anomaly Detection
              </span>


              <strong>
                {anomalyStatus}
              </strong>


            </div>


            <div className="ai-card">

              <ShieldAlert />

              <span>
                Risk Analysis
              </span>


              <strong>
                {risk}
              </strong>


            </div>


            <div className="ai-card">

              <Zap />

              <span>
                Inference
              </span>


              <strong>
                API INFERENCE
              </strong>


            </div>


          </div>


          <div className="ai-footer">


            <div>

              <span>
                MODEL
              </span>


              <strong>
                Random Forest
              </strong>


            </div>


            <div>

              <span>
                INPUTS
              </span>


              <strong>
                4 Sensor Features
              </strong>


            </div>


            <div>

              <span>
                OUTPUT
              </span>


              <strong>
                3 Risk Classes
              </strong>


            </div>


            <div>

              <span>
                STATUS
              </span>


              <strong>
                ACTIVE
              </strong>


            </div>


          </div>


        </section>



        {/* =================================================
            FOOTER
            ================================================= */}

        <footer>


          <span>
            Environmental Intelligence Network
          </span>


          <span>
            AI + FastAPI Prototype • SIH 2026
          </span>


        </footer>


      </main>


    </div>
  );
}


export default App;