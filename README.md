# Homebridge TP-Link Tapo

A [Homebridge](https://homebridge.io) plugin for TP-Link Tapo smart devices using the KLAP protocol.

> Forked from [RaresAil/homebridge-tp-link-tapo](https://github.com/RaresAil/homebridge-tp-link-tapo) (archived).

### Requirements

- **Homebridge 2.x**
- **Node.js 22+**
- Devices must support the **KLAP protocol** (legacy RSA/securePassthrough is not supported)

### Supported device types

- Socket/Outlet (with optional power measurement via contact sensor)
- Hub (as alarm)
- Button S200
- Contact Sensor (T110)
- Light Bulb
- LED Strip

### Config

You can add multiple devices with a single platform.

```json
{
  "platforms": [
    {
      "platform": "HomebridgeTPLinkTapo",
      "name": "TPLink Tapo Platform",
      "email": "tplink-email",
      "password": "tplink-password",
      "addresses": ["192.168.x.x (the ip address of the device)"]
    }
  ]
}
```
