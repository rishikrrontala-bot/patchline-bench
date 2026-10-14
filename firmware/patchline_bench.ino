// Patchline Bench — Built by Rishik Rontala.
// DRY BENCH ONLY. No therapeutic driver or actuation command exists.
#include <Arduino.h>
#include <Wire.h>
#include "bench_core.h"

#ifndef BENCH_SIMULATION
#define BENCH_SIMULATION 1 // Switch only after bench wiring and calibration review.
#endif
// TMP117 MUST be configured to0x49; ADS1115 retains0x48. Default addresses collide.
constexpr uint8_t ADC_ADDRESS=0x48, TEMP_ADDRESS=0x49;
const bench::Calibration PH{false,0,0,0,3,0,14};
const bench::Calibration MOISTURE{false,0,0,0,3,0,100};
const bench::Calibration GLUCOSE_AU{false,0,0,0,3,0,5};
uint32_t last_tick=0,sequence=0;
uint64_t elapsed_ms=0;

// Every I2C transaction has a bus timeout; conversion polling has an elapsed deadline.
bool write_register(uint8_t address,uint8_t reg,uint16_t value){
 Wire.beginTransmission(address);Wire.write(reg);Wire.write(static_cast<uint8_t>(value>>8));Wire.write(static_cast<uint8_t>(value));return Wire.endTransmission()==0;
}
bool read_register(uint8_t address,uint8_t reg,uint16_t &value){
 Wire.beginTransmission(address);Wire.write(reg);if(Wire.endTransmission(false)!=0)return false;
 if(Wire.requestFrom(address,static_cast<uint8_t>(2))!=2){while(Wire.available())Wire.read();return false;}
 value=(static_cast<uint16_t>(Wire.read())<<8)|static_cast<uint8_t>(Wire.read());return true;
}
double read_adc(uint8_t channel){
 const uint16_t mux=static_cast<uint16_t>(0x4000+channel*0x1000);
 // OS single start | channel MUX | PGA +/-4.096 V | single-shot |128 SPS | comparator off.
 if(!write_register(ADC_ADDRESS,1,0x8000|mux|0x0200|0x0100|0x0080|0x0003))return NAN;
 const uint32_t started=millis();uint16_t config=0,raw=0;
 while(!bench::elapsed(millis(),started,100)){
  if(!read_register(ADC_ADDRESS,1,config))return NAN;
  if(config&0x8000){if(!read_register(ADC_ADDRESS,0,raw))return NAN;return static_cast<int16_t>(raw)*(4.096/32768.0);}
  delay(1);
 }
 return NAN;
}
double read_temperature(){
 uint16_t id=0,raw=0;if(!read_register(TEMP_ADDRESS,0x0F,id)||(id&0x0FFF)!=0x0117||!read_register(TEMP_ADDRESS,0,raw))return NAN;
 const double value=static_cast<int16_t>(raw)/128.0;return std::isfinite(value)&&value>=-40&&value<=100?value:NAN;
}
void frame(double t,double ph,double temperature,double moisture,double glucose,const char* provenance,bench::Reading p,bench::Reading m,bench::Reading g) {
  char a[32],b[32],c[32],d[32],r1[32],r2[32],r3[32];
  bench::number(a,sizeof a,ph);bench::number(b,sizeof b,temperature);bench::number(c,sizeof c,moisture);bench::number(d,sizeof d,glucose);
  bench::number(r1,sizeof r1,p.raw_volts);bench::number(r2,sizeof r2,m.raw_volts);bench::number(r3,sizeof r3,g.raw_volts);
  const bool simulated=strcmp(provenance,"synthetic")==0;
  Serial.printf("{\"schema\":\"patchline-bench-frame-v1\",\"seq\":%lu,\"t\":%.3f,\"provenance\":\"%s\",\"ph\":%s,\"temperature\":%s,\"moisture\":%s,\"glucose\":%s,\"raw\":{\"ph_v\":%s,\"moisture_v\":%s,\"glucose_v\":%s},\"status\":{\"ph\":\"%s\",\"temperature\":\"%s\",\"moisture\":\"%s\",\"glucose\":\"%s\"},\"hardware_actuation\":false}\n",static_cast<unsigned long>(sequence++),t,provenance,a,b,c,d,r1,r2,r3,simulated?"simulated":bench::name(p.status),simulated?"simulated":(std::isfinite(temperature)?"measured":"missing"),simulated?"simulated":bench::name(m.status),simulated?"simulated":bench::name(g.status));
}
void setup() {
  Serial.begin(115200);
#if !BENCH_SIMULATION
#ifdef PIN_I2C_POWER
  pinMode(PIN_I2C_POWER,OUTPUT);digitalWrite(PIN_I2C_POWER,HIGH);
#endif
  Wire.begin();Wire.setTimeOut(50);
#endif
  last_tick=millis();
}
void loop() {
  const uint32_t now=millis();if(!bench::elapsed(now,last_tick,500))return;
  elapsed_ms+=static_cast<uint32_t>(now-last_tick);last_tick=now;
  const double t=elapsed_ms/1000.0;
#if BENCH_SIMULATION
  const bench::Reading unmeasured{NAN,NAN,bench::Status::uncalibrated};
  frame(t,6.7+0.015*sin(t),27.0+0.03*sin(t/3),45.0+0.2*sin(t/4),0.6+0.005*sin(t/2),"synthetic",unmeasured,unmeasured,unmeasured);
#else
  bench::Reading p{NAN,NAN,bench::Status::missing},m=p,g=p;
  p=bench::convert(read_adc(0),PH);m=bench::convert(read_adc(1),MOISTURE);g=bench::convert(read_adc(2),GLUCOSE_AU);
  const double temperature=read_temperature();
  frame(t,p.value,temperature,m.value,g.value,"bench",p,m,g);
#endif
}
