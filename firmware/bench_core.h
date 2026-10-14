#pragma once
#include <cmath>
#include <cstdint>
#include <cstdio>

namespace bench {
// No actuation API exists. This module handles bench acquisition and telemetry.
enum class Status { missing, uncalibrated, measured, invalid };
struct Reading { double raw_volts; double value; Status status; };
struct Calibration { bool reviewed; double slope; double intercept; double raw_min; double raw_max; double value_min; double value_max; };
inline Reading convert(double volts, const Calibration& c) {
  if (!std::isfinite(volts)) return {NAN, NAN, Status::missing};
  if (volts < 0 || volts > 3.0) return {volts, NAN, Status::invalid};
  if (!c.reviewed) return {volts, NAN, Status::uncalibrated};
  if (!std::isfinite(c.slope) || !std::isfinite(c.intercept) || !std::isfinite(c.raw_min) || !std::isfinite(c.raw_max) || !std::isfinite(c.value_min) || !std::isfinite(c.value_max) || c.raw_min >= c.raw_max || c.value_min >= c.value_max || volts < c.raw_min || volts > c.raw_max) return {volts, NAN, Status::invalid};
  const double value = c.slope * volts + c.intercept;
  if (!std::isfinite(value) || value < c.value_min || value > c.value_max) return {volts, NAN, Status::invalid};
  return {volts, value, Status::measured};
}
inline const char* name(Status status) {
  switch(status) { case Status::missing:return "missing";case Status::uncalibrated:return "uncalibrated";case Status::measured:return "measured";case Status::invalid:return "invalid"; } return "invalid";
}
inline bool elapsed(uint32_t now, uint32_t then, uint32_t interval) { return static_cast<uint32_t>(now - then) >= interval; }
inline void number(char* out, size_t length, double value) { if(std::isfinite(value)) std::snprintf(out,length,"%.8g",value);else std::snprintf(out,length,"null"); }
inline constexpr bool hardware_actuation_available = false;
}
