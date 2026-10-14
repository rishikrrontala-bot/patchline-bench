#pragma once
#include <cstdint>
#include <vector>
struct HostWire{
 int fail=0,received=2,reg=0,cursor=0,timeout=0;bool ready=true;uint16_t adcRaw=8000,tempRaw=3456,deviceID=0x0117,lastConfig=0;uint8_t address=0;std::vector<uint8_t> tx;
 void begin(){}void setTimeOut(int ms){timeout=ms;}void beginTransmission(uint8_t a){address=a;tx.clear();}void write(uint8_t x){tx.push_back(x);}int endTransmission(bool=true){if(!tx.empty())reg=tx[0];if(tx.size()==3)lastConfig=(uint16_t(tx[1])<<8)|tx[2];return fail;}
 int requestFrom(uint8_t,uint8_t){cursor=0;return received;}int available(){return cursor<received;}
 int read(){uint16_t v=address==0x49?(reg==15?deviceID:tempRaw):(reg==1?(ready?0x8000:0):adcRaw);return cursor++==0?v>>8:v&255;}
};inline HostWire Wire;
