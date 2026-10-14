#include <cassert>
#include <cmath>
#include "patchline_bench.ino"
int main(){
 Wire.fail=1;assert(std::isnan(read_adc(0)));assert(std::isnan(read_temperature()));
 Wire.fail=0;Wire.received=1;assert(std::isnan(read_adc(0)));assert(std::isnan(read_temperature()));
 Wire.received=2;Wire.ready=false;host_clock=0;assert(std::isnan(read_adc(0)));assert(host_clock<200);
 host_clock=UINT32_MAX-50;const uint32_t started=host_clock;assert(std::isnan(read_adc(0)));assert(static_cast<uint32_t>(host_clock-started)<200);
 Wire.ready=true;assert(std::abs(read_adc(0)-1.0)<1e-12);assert(std::abs(read_temperature()-27.0)<1e-12);
 for(uint8_t channel=0;channel<3;channel++){assert(read_adc(channel)==1);assert(Wire.lastConfig==static_cast<uint16_t>(0xC383+channel*0x1000));}
 Wire.deviceID=0x0120;assert(std::isnan(read_temperature()));Wire.deviceID=0x2117;assert(read_temperature()==27);
 Wire.tempRaw=static_cast<uint16_t>(101*128);assert(std::isnan(read_temperature()));
 Wire.tempRaw=static_cast<uint16_t>(static_cast<int16_t>(-41*128));assert(std::isnan(read_temperature()));
 Wire.tempRaw=static_cast<uint16_t>(static_cast<int16_t>(-1280));assert(read_temperature()==-10);
 Wire.adcRaw=static_cast<uint16_t>(static_cast<int16_t>(-100));assert(read_adc(0)<0);
 const auto uncal=bench::convert(1.0,PH);assert(uncal.status==bench::Status::uncalibrated);assert(std::isnan(uncal.value));
 host_clock=0;setup();host_clock=600;loop();
#if !BENCH_SIMULATION
 assert(Wire.timeout==50);
#endif
}
