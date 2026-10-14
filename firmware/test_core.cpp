#include "bench_core.h"
#include <cassert>
#include <cstring>
int main() {
  using namespace bench;
  Calibration c{false,1,0,0,3,0,14};
  assert(convert(1,c).status==Status::uncalibrated);
  assert(convert(NAN,c).status==Status::missing);
  assert(convert(-0.01,c).status==Status::invalid);
  assert(convert(3.01,c).status==Status::invalid);
  c={true,2,1,0,3,0,14};assert(convert(1,c).value==3);
  c.slope=INFINITY;assert(convert(1,c).status==Status::invalid);
  c={true,2,1,0,3,0,2};assert(convert(1,c).status==Status::invalid);
  assert(elapsed(500,0,500));assert(!elapsed(499,0,500));
  assert(elapsed(20,UINT32_MAX-10,30));
  char b[32];number(b,sizeof b,NAN);assert(!std::strcmp(b,"null"));
  number(b,sizeof b,1.5);assert(!std::strcmp(b,"1.5"));
  static_assert(!hardware_actuation_available);return 0;
}
