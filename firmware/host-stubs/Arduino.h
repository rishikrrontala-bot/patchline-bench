#pragma once
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <cmath>
inline uint32_t host_clock=0;
inline uint32_t millis(){return host_clock++;}
inline void delay(uint32_t ms){host_clock+=ms;}
inline void pinMode(int,int){}
inline void digitalWrite(int,int){}
constexpr int OUTPUT=1,HIGH=1;
struct HostSerial{void begin(int){};template<class... A>void printf(const char*f,A...a){std::printf(f,a...);}};
inline HostSerial Serial;
