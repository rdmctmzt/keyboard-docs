# 命令说明

厂商鼠标 AP 协议通过 WebHID 收发。报告号固定为 **`0xaa`**。命令表固定为 **`CMD_MOUSE`**，与《睿鼎荣鼠标软件驱动协议》`Ap_Function_Comd_Type` 对齐，**不按**键盘 `protocolVer` 切 V1–V4。


## 注意事项

| 条件 | 说明 |
|---|---|
| 日常业务优先用封装 API | 本页供排查协议 / 自研传输；一般不必手拼包 |
| 须先开通讯 | 业务命令前固件要 `0x10`；SDK 传输层会自动发 |
| 与键盘编号差异 | `0x10`–`0x21` 与键盘相同；**自 `0x22` 起编号不同**（宏 / 电量 / 复位等） |
| 有线 / 2.4G | **有效载荷**不同：有线 `0x38`，2.4G `0x18`（见下表；勿把整帧 `0x20` 当 size） |
| 成功判定 | 应答 `status === 0x55`（协议第 8 字节） |
| 未发 `0x10` | 应答第 8 字节可能为 `0x0F`；长时间无有效通讯约 5s 后需重新开通讯 |
| `0xD0` | 仅 **2.4G** 查询/上报 RF 状态；有线业务路径不要发 |

## 包格式

### 协议头（8 字节）+ 数据

协议文档描述（无独立 Report ID 的厂商口）：

| Byte | 含义 |
|---|---|
| 0 | `0xAA`（识别头 / 代替 Report ID） |
| 1 | Command |
| 2–3 | ADDR（偏移，小端） |
| 4 | **Length = 本包有效数据长度**（不含这 8 字节头） |
| 5–6 | CRC16（暂未启用，填 0） |
| 7 | 应答结果：`0x55` 成功 / `0x0F` 失败 |
| 8… | 数据 |

WebHID 下发时 SDK 使用：

```
sendReport(hidReportId, [0xaa, cmd, offsetLo, offsetHi, size, 0, 0, …payload])
```

逻辑占位 `[0, 0xaa, …]` 里的首位 **不是** HID reportId；真正的 HID reportId 从描述符 Output Report 解析（常见 `0` 或 `0x3F`）。

### 有效载荷上限（`packetSize` / 命令里的 size）

| 链路 | 报告/帧 | 头 | **有效数据上限** | SDK `packetSize` |
|---|---|---|---|---|
| USB 有线 | 常 64B 数据区 | 8B | **`0x38`（56）** | `0x38`（默认） |
| 2.4G | **32B** 帧 | 8B | **`0x18`（24）** | `0x18` |

| 错误用法 | 为何不对 |
|---|---|
| 2.4G 传 `packetSize: 0x20` | `0x20` 是整帧长度，不是有效载荷；有效最多 `0x18` |
| 信息区有线发 `size=0x38` 再跟一包 `0x0f` | 鼠标信息有效到索引 27，读 **32** 字节即可（一包 `size=0x20`） |

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

读信息区、功能区、键表、宏时：

| 参数 | 含义 |
|---|---|
| `offset` | 目标缓冲起始偏移（小端 16bit） |
| `size` | 本包读取/写入**有效**长度（≤ `packetSize`，**不含** 8 字节头） |

| 区域 | 建议读取 | 有线 | 2.4G |
|---|---|---|---|
| 信息区 `0x12` | **32** 字节（到索引 27） | 一包 `size=0x20` | `0x18` + `0x08` |
| 功能区 `0x14` | 有效 **102** 字节（`0..101`），缓冲对齐 **128** | 按 `0x38` 分包 | 按 `0x18` 分包 |
| 键表一层 | **384** 字节（128×3） | 按 `0x38` 分包 | 按 `0x18` 分包 |

写单键：`offset = keyIndex * 3`，`size = 3`，payload 为 `type, code1, code2`。

---

## 完整命令表（协议 `Ap_Function_Comd_Type`）

| 协议名 | 值 | 说明 | SDK |
|---|---|---|---|
| `AP_FUNC_START` | `0x10` | 开始通讯 | 自动 |
| `AP_FUNC_STOP` | `0x11` | 结束通讯 | 写完功能区/键/宏等会关 |
| `AP_READ_INFO` | `0x12` | 读取设备基本信息 | `getDeviceInfo()` |
| `AP_WRITE_INFO` | `0x13` | 设定设备基本信息 | —（预留） |
| `AP_READ_FUNC` | `0x14` | 读取功能区信息 | `getFuncInfo()` |
| `AP_WRITE_FUNC` | `0x15` | 设定功能区信息 | `setFuncInfo()` / `patchFuncInfo()` / `setDpi` / `setParams` |
| `AP_READ_DEFAULT_MATRIX1` | `0x16` | 读取默认按键矩阵信息 1 | `getDefaultKeymap(0)` |
| `AP_READ_DEFAULT_MATRIX2` | `0x17` | 读取默认按键矩阵信息 2 | `getDefaultKeymap(1)` |
| `AP_READ_DEFAULT_MATRIX3` | `0x18` | 读取默认按键矩阵信息 3 | `getDefaultKeymap(2)` |
| `AP_READ_DEFAULT_MATRIX4` | `0x19` | 读取默认按键矩阵信息 4 | `getDefaultKeymap(3)` |
| `AP_READ_MATRIX1` | `0x1A` | 读取按键矩阵 1 信息 | `getKeymap(0)` |
| `AP_WRITE_MATRIX1` | `0x1B` | 设定按键矩阵 1 信息 | `setKey(0, …)` |
| `AP_READ_MATRIX2` | `0x1C` | 读取按键矩阵 2 信息 | `getKeymap(1)` |
| `AP_WRITE_MATRIX2` | `0x1D` | 设定按键矩阵 2 信息 | `setKey(1, …)` |
| `AP_READ_MATRIX3` | `0x1E` | 读取按键矩阵 3 信息 | `getKeymap(2)` |
| `AP_WRITE_MATRIX3` | `0x1F` | 设定按键矩阵 3 信息 | `setKey(2, …)` |
| `AP_READ_MATRIX4` | `0x20` | 读取按键矩阵 4 信息 | `getKeymap(3)` |
| `AP_WRITE_MATRIX4` | `0x21` | 设定按键矩阵 4 信息 | `setKey(3, …)` |
| `AP_READ_DEFINE1_LED` | `0x22` | 读取自定义灯光数据 1 信息 | — |
| `AP_WRITE_DEFINE1_LED` | `0x23` | 设定自定义灯光数据 1 信息 | — |
| `AP_READ_MACRO` | `0x24` | 读取宏信息 | `getMacros()` |
| `AP_WRITE_MACRO` | `0x25` | 设定宏信息 | `setMacros()` |
| `AP_CONTROL_LED_START` | `0x26` | 同步控制灯光（音乐律动） | — |
| `AP_CONTROL_LED_STOP` | `0x27` | 关闭同步控制灯光 | — |
| `AP_READ_BATT` | `0x28` | 读取电池状态（有电池才有） | `getBatteryStatus()` |
| `AP_FUNC_RESET` | `0x29` | 复位 | `restoreFactorySettings()` |
| `AP_READ_LED_MATRIX` | `0x2A` | 读取灯光矩阵信息 | — |
| `AP_READ_BL_MODE` | `0x2B` | 读取背光灯光实际使用的灯光模式 | — |
| `AP_READ_LED_DATA` | `0x2C` | 读取灯光模式颜色数据（音乐律动） | — |
| `AP_READ_LOGO_INDEX` | `0x2D` | 读取 LOGO 灯灯光矩阵信息 | — |
| `AP_READ_LG_MODE` | `0x2E` | 读取 LOGO 灯灯光实际使用的灯光模式 | — |
| `AP_2P4G_STATUS` | `0xD0` | 获取 2.4G 状态（定值） | `getRfStatus()` / `on('rfStatus')` |

键表每键 **3 字节**：`type` + `code1` + `code2`，一层 **128 键 = 384 字节**。详见 [键值表](../keycodes)。

灯光矩阵：`实际灯光位置 = AP_BUFF[实际按键位置]`；Index 为 `0xFF` 表示该键无匹配灯光。

---

## 与键盘命令对照（易混项）

| 功能 | 鼠标 | 键盘 V2 典型值 |
|---|---|---|
| 读/写宏 | `0x24` / `0x25` | `0x2c` / `0x2d` |
| 电量 | `0x28` | `0x30` |
| 恢复出厂 | `0x29` | `0x31` |
| 灯同步开/关 | `0x26` / `0x27` | `0x3c` / `0x3d` |
| 用户灯槽 | 仅 `0x22` / `0x23` | `0x22`–`0x2b` 多槽 |

`0x10`–`0x21`（会话 / 信息区 / 功能区 / 键表）两边一致。

---

## 按功能索引

| 功能 | 主要命令 | API 文档 |
|---|---|---|
| 设备能力 | `0x12` | [设备信息](./info) |
| 运行配置（DPI / 回报率 / LOD / 休眠 / 灯） | `0x14` / `0x15` | [全局设置](./globalSetting) · [性能 / DPI](./performance) |
| 改键 | `0x16`–`0x21` | [按键映射](./keyRemapping) |
| 宏 | `0x24` / `0x25` | [宏](./macro) |
| 电量 | `0x28` | [全局设置 · getBatteryStatus](./globalSetting#getbatterystatus) |
| 出厂复位 | `0x29` | [全局设置 · restoreFactorySettings](./globalSetting#restorefactorysettings) |
| 2.4G 状态 | `0xD0` | [全局设置 · getRfStatus](./globalSetting#getrfstatus) |
