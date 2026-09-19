# 命令说明

厂商键盘 AP 协议通过 WebHID 收发。报告号固定为 **`0xaa`**。命令表随 `protocolVer` 切换（对齐驱动 `cmdVersions.ts`）。

SDK 侧对应：`CMD_V1` / `CMD_V2` / `CMD_V3` / `CMD_V4`，由 `resolveProtocolCmdTable(protocolVer)` 选取。

## 注意事项

| 条件 | 说明 |
|---|---|
| 日常业务优先用封装 API | 本页供排查协议 / 自研传输；一般不必手拼包 |
| 须先开通讯 | 业务命令前固件要 `0x10`；SDK 传输层会自动发 |
| 先读 `protocolVer` | 命令号随版本表变化，错表会导致读写错乱 |
| 有线 / 2.4G | 分包长度不同：默认 `0x38`，2.4G 常用 `0x18`（`packetSize`） |
| 成功判定 | 应答 `status === 0x55` |

## 包格式

### 下发

```
[ reportId=0 ][ 0xaa ][ cmd ][ offsetLo ][ offsetHi ][ size ][ …保留/校验 ][ payload… ]
```

| 项 | 说明 |
|---|---|
| 有线整包 | 常 pad 到 **65** 字节（含 reportId） |
| 分包长度 | 默认 **`0x38`（56）**；2.4G 常用 **`0x18`（24）** → SDK `packetSize` |
| 会话 | 业务命令前固件需先 **`0x10` 开通讯**（SDK 传输层自动发） |

### 应答

```
[ 0xaa ][ cmd ][ … ][ status@+7 ][ data… ]
```

| 项 | 说明 |
|---|---|
| 成功 | `status === 0x55` |
| 前缀 | 偶发前面多 1 字节；SDK 会定位 `0xaa` 头 |
| 通知 | `0xd0` 等为主动通知，不当作普通业务应答 |

### offset / size

读信息区、功能区、键表、宏、灯色时：

| 参数 | 含义 |
|---|---|
| `offset` | 目标缓冲起始偏移（小端 16bit） |
| `size` | 本包读取/写入长度（不超过 `packetSize`） |

写单键：`offset = keyIndex * 3`，`size = 3`，payload 为 `type, code1, code2`。

---

## V1 完整命令表（`protocolVer === 1`）

| 命令 | 值 | 说明 | SDK |
|---|---|---|---|
| `REPORT_ID` | `0xaa` | HID 报告号 | 传输层 |
| `CMD_START_COMM` | `0x10` | 开通讯 | 自动 |
| `CMD_STOP_COMM` | `0x11` | 关通讯 | 写完功能区/键/宏等会关 |
| `CMD_GET_DEVICEINFO` | `0x12` | 读信息区 | `getDeviceInfo()` |
| `CMD_SET_DEVICEINFO` | `0x13` | 写信息区（少用） | — |
| `CMD_GET_FUNCINFO` | `0x14` | 读功能区 | `getFuncInfo()` |
| `CMD_SET_FUNCINFO` | `0x15` | 写功能区 | `setFuncInfo()` / `patchFuncInfo()` |
| `CMD_GET_DEFAULT_0` | `0x16` | 读默认层 0 | `getDefaultKeymap(0)` |
| `CMD_GET_DEFAULT_1` | `0x17` | 读默认层 1 | `getDefaultKeymap(1)` |
| `CMD_GET_DEFAULT_2` | `0x18` | 读默认层 2 | `getDefaultKeymap(2)` |
| `CMD_GET_DEFAULT_3` | `0x19` | 读默认层 3 | `getDefaultKeymap(3)` |
| `CMD_GET_USERKEY_0` | `0x1a` | 读用户层 0 | `getKeymap(0)` |
| `CMD_SET_USERKEY_0` | `0x1b` | 写用户层 0 | `setKey(0, …)` |
| `CMD_GET_USERKEY_1` | `0x1c` | 读用户层 1 | `getKeymap(1)` |
| `CMD_SET_USERKEY_1` | `0x1d` | 写用户层 1 | `setKey(1, …)` |
| `CMD_GET_USERKEY_2` | `0x1e` | 读用户层 2 | `getKeymap(2)` |
| `CMD_SET_USERKEY_2` | `0x1f` | 写用户层 2 | `setKey(2, …)` |
| `CMD_GET_USERKEY_3` | `0x20` | 读用户层 3 | `getKeymap(3)` |
| `CMD_SET_USERKEY_3` | `0x21` | 写用户层 3 | `setKey(3, …)` |
| `CMD_GET_USERLIGHT_1` | `0x22` | 读用户灯槽 0 | `getUserKeyColors(0)` |
| `CMD_SET_USERLIGHT_1` | `0x23` | 写用户灯槽 0 | `setUserKeyColor` / `setUserAllKeyColors` |
| `CMD_GET_USERLIGHT_2` | `0x24` | 读用户灯槽 1 | `getUserKeyColors(1)` |
| `CMD_SET_USERLIGHT_2` | `0x25` | 写用户灯槽 1 | 同上 |
| `CMD_GET_USERLIGHT_3` | `0x26` | 读用户灯槽 2 | `getUserKeyColors(2)` |
| `CMD_SET_USERLIGHT_3` | `0x27` | 写用户灯槽 2 | 同上 |
| `CMD_GET_USERLIGHT_4` | `0x28` | 读用户灯槽 3 | `getUserKeyColors(3)` |
| `CMD_SET_USERLIGHT_4` | `0x29` | 写用户灯槽 3 | 同上 |
| `CMD_GET_USERLIGHT_5` | `0x2a` | 读用户灯槽 4 | `getUserKeyColors(4)` |
| `CMD_SET_USERLIGHT_5` | `0x2b` | 写用户灯槽 4 | 同上 |
| `CMD_GET_MACRODATA` | `0x2c` | 读宏区 | `getMacros()` |
| `CMD_SET_MACRODATA` | `0x2d` | 写宏区 | `setMacros()` |
| `CMD_RESTORE_FACTORYSETTINGS` | `0x31` | 恢复出厂 | `restoreFactorySettings()` |
| `CMD_GET_LIGHT_MATRIX` | `0x32` | 键位→灯位映射 | `getLightMatrix()` |
| `CMD_GET_BL_MODE` | `0x33` | 背光模式表 | `getBackLightModes()` |
| `CMD_GET_LG_MODE` | `0x34` | LOGO 模式表 | `getLogoLightModes()` |
| `CMD_GET_SD_MODE` | `0x35` | 侧灯模式表 | `getSideLightModes()` |
| `CMD_GET_LIGHT_MODE_DATA` | `0x36` | 当前灯效颜色数据 | — |
| `CMD_GET_WHEEL_DATA` | `0x37` | 滚轮数据 | — |

键表每键 **3 字节**：`type` + `code1` + `code2`，一层 **128 键 = 384 字节**（驱动按 512 缓冲读写对齐）。详见 [键值表](../keycodes)。

---

## V2 增量与覆盖（`protocolVer === 2`）

V2 **继承 V1**，下列命令为新增或改号（最终以对象字面量覆盖后的值为准）。

| 命令 | 值 | 相对 V1 | 说明 | SDK |
|---|---|---|---|---|
| `CMD_SET_LIGHT` | `0x2e` | 新增 | 开灯同步相关 | — |
| `CMD_CLOSE_LIGHT` | `0x2f` | 新增 | 关灯同步相关 | — |
| `CMD_GET_BATTERY_STATUS` | `0x30` | 新增 | 电量 | `getBatteryStatus()` |
| `CMD_GET_LIGHT_MODE_DATA` | `0x34` | **改号**（原 V1 LOGO） | 当前灯效颜色数据 | — |
| `CMD_GET_LG_MODE` | `0x35` | **改号** | LOGO 模式表 | `getLogoLightModes()` |
| `CMD_GET_SD_MODE` | `0x36` | **改号** | 侧灯模式表 | `getSideLightModes()` |
| `CMD_GET_LOGO_LIGHT_MATRIX` | `0x37` | 新增（占原滚轮号） | LOGO 灯矩阵 | — |
| `CMD_GET_SIDE_LIGHT_MATRIX` | `0x38` | 新增 | 侧灯矩阵 | — |
| `CMD_GET_LIGHT_MODE` | `0x39` | 新增 | 灯光模式 | — |
| `CMD_GET_USER_LIGHT_DATA` | `0x3a` | 新增 | 读用户灯数据 | — |
| `CMD_SET_USER_LIGHT_DATA` | `0x3b` | 新增 | 写用户灯数据 | — |
| `CMD_SET_LIGHT_SYNC` | `0x3c` | 新增 | 开启灯同步 | — |
| `CMD_CLOSE_LIGHT_SYNC` | `0x3d` | 新增 | 关闭灯同步 | — |
| `CMD_GET_WHEEL_DATA` | `0x3e` | **改号** | 滚轮数据 | — |
| `CMD_GET_MATRIX_DYNAMIC_DATA` | `0x3f` | 新增 | 读点阵单色动态 | — |
| `CMD_SET_MATRIX_DYNAMIC_DATA` | `0x40` | 新增 | 写点阵单色动态 | — |
| `CMD_GET_MATRIX_MODE` | `0x41` | 新增 | 读点阵模式 | — |
| `CMD_SET_MATRIX_MODE` | `0x42` | 新增 | 写点阵模式 | — |
| `CMD_SET_LIGHT_ON` | `0xe0` | 新增 | 灯总开 | — |
| `CMD_SET_LIGHT_OFF` | `0xe1` | 新增 | 灯总关 | — |
| `CMD_CHECK_LIGHT_STATUS` | `0xe2` | 新增 | 查灯状态 | — |

> 驱动源码里曾出现 `CMD_GET_MATRIX_POSITION: 0x40`，随后被同表 `CMD_SET_MATRIX_DYNAMIC_DATA: 0x40` 覆盖；**有效值以 `0x40` = 写点阵动态为准**。

V2 中仍继承、未改号的 V1 命令：`0x10`–`0x2d`、`0x31`–`0x33`（会话 / 信息区 / 功能区 / 键表 / 用户灯色 / 宏 / 复位 / 背光矩阵与背光模式）。

---

## V3 增量（`protocolVer === 3`）

继承 V2，仅增加：

| 命令 | 值 | 说明 | SDK |
|---|---|---|---|
| `CMD_Get_Keyboard` | `0xd0` | 2.4G 连接状态查询 / 主动通知 | `getRfStatus()` / `on('rfStatus')` |

---

## V4 增量与改号（`protocolVer === 4`）

继承 V3，GIF / 滚轮号段调整：

| 命令 | 值 | 相对 V2/V3 | 说明 | SDK |
|---|---|---|---|---|
| `CMD_GET_LT_GIF` | `0x3e` | **改号**（原滚轮） | 读点阵 GIF | — |
| `CMD_SET_LT_GIF` | `0x3f` | **改号**（原点阵动态读） | 写点阵 GIF | — |
| `CMD_GET_WHEEL_DATA` | `0x40` | **改号** | 滚轮数据 | — |
| `CMD_GET_MATRIX_DYNAMIC_DATA` | `0x3e` | 与 GIF 读同号 | 点阵动态读（别名） | — |
| `CMD_SET_MATRIX_DYNAMIC_DATA` | `0x3f` | 与 GIF 写同号 | 点阵动态写（别名） | — |
| `CMD_GET_MATRIX_MODE` | `0x41` | 保留 | 读点阵模式（迎宾等） | — |
| `CMD_SET_MATRIX_MODE` | `0x42` | 保留 | 写点阵模式 | — |
| `CMD_LCD_GIF_SYNCHRONIZA` | `0xe3` | 新增 | LCD GIF 同步 | — |

---

## 按功能索引

| 功能 | 主要命令 | API 文档 |
|---|---|---|
| 设备能力 | `0x12` | [设备信息](./info) |
| 运行配置 | `0x14` / `0x15` | [功能区](./func) |
| 改键 | `0x16`–`0x21` | [布局/改键](./key) |
| 灯光 / 律动 | 功能区 + `0x22`–`0x2b`、`0x2e`、`0x32`–`0x36` | [灯光](./lighting) |
| 点阵屏 | `0x3a`–`0x42`、V4 GIF | [点阵屏](./matrix) |
| LCD | 功能区 + `0xe0`–`0xe3`；屏 HID `0x12`/`0x15`–`0x1a` | [LCD](./lcd) |
| 编码器 | `CMD_GET_WHEEL_DATA` + 功能区 | [编码器](./encoder) |
| 性能 | 功能区字段 | [性能](./performance) |
| 宏 | `0x2c` / `0x2d` | [宏](./macro) |
| 电量 | `0x30`（V2+） | [其它 API · getBatteryStatus](./misc#getbatterystatus) |
| 2.4G 状态 | `0xd0`（V3+） | [其它 API · getRfStatus](./misc#getrfstatus) |
| 出厂复位 | `0x31` | [其它 API · restoreFactorySettings](./misc#restorefactorysettings) |
| 生命周期 / 缓存 | 会话 `0x10`/`0x11` 等 | [其它 API](./misc) |
