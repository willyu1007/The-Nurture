# Compatibility plan

This is additive and non-breaking. A staging release without the reference
keeps W3 disabled; the release operator must provision the independent BWS
entry before starting the provider image. Provider and consumer W3 gates stay
false throughout carrier-cutover rehearsal, so reference delivery does not
activate traffic.
