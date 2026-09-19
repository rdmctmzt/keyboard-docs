# 命令说明

VIA 协议通过 WebHID 收发。正文 **32 字节**，**Byte0 = 父命令**（无业务 Report ID）。多字节参数均为 **大端**。

WebHID 写入时常见形式：`reportId=0` + 32 字节正文（整包 pad 到 **33**，对齐驱动 `deviceMode=2`）。

**不要**对 VIA 接口发厂商协议的 `0x10` 开通讯。

## 注意事项

| 条件 | 说明 |
|---|---|
| 日常业务优先用封装 API | 本页供排查 / 自研传输 |
| 与厂商键盘不同 | 无 `0xaa` 头、无 `status=0x55` 成功字节 |
| 应答 | Byte0（或带 reportId 前缀后）回显同一父命令；前半段与请求一致 |
| Res 字段 | 未使用字节须为 `0` |

## 包格式

### 下发

```
[ reportId=0 ][ viaCmd ][ param… ][ 0×pad ]
```

| 项 | 说明 |
|---|---|
| 正文 | 32 字节，`viaCmd` 在正文 Byte0 |
| 整包 | SDK 默认 `packetLength = 33`（含 reportId） |
| 字节序 | 16/32-bit 大端 |

### 应答

```
[ viaCmd ][ 与请求一致的参数前缀 ][ 数据… ]
```

部分环境前导 `reportId=0` 或偶发 `0xaa` 包装；SDK 用 `findViaCommandIndex` 定位命令字节。

---

## 完整父命令表

| 协议名 | 值 | 说明 | SDK |
|---|---|---|---|
| `id_get_protocol_version` | `0x01` | 协议版本 | `getProtocolVersion()` |
| `id_get_keyboard_value` | `0x02` | 读键盘值 | `getKeyboardValue()` / `getFirmwareVersion()` |
| `id_set_keyboard_value` | `0x03` | 写键盘值 | `setKeyboardValue()` |
| `id_dynamic_keymap_get_keycode` | `0x04` | 读单键 | `getKey()` |
| `id_dynamic_keymap_set_keycode` | `0x05` | 写单键 | `setKey()` |
| `id_dynamic_keymap_reset` | `0x06` | 清空动态 keymap | `clearAllKeymaps()` |
| `id_custom_set_value` | `0x07` | 写灯光/自定义 | `setCustomMenuValue()` / `setLightingValue()` |
| `id_custom_get_value` | `0x08` | 读灯光/自定义 | `getCustomMenuValue()` |
| `id_custom_save` | `0x09` | 保存自定义通道 | `saveCustomMenu()` |
| `id_eeprom_reset` | `0x0A` | EEPROM 复位 | `resetEeprom()` |
| `id_bootloader_jump` | `0x0B` | 进 Bootloader | `jumpToBootloader()` |
| `id_dynamic_keymap_macro_get_count` | `0x0C` | 宏槽数 | `getMacroCount()` |
| `id_dynamic_keymap_macro_get_buffer_size` | `0x0D` | 宏缓冲大小 | `getMacroBufferSize()` |
| `id_dynamic_keymap_macro_get_buffer` | `0x0E` | 读宏缓冲 | `getMacroBytes()` |
| `id_dynamic_keymap_macro_set_buffer` | `0x0F` | 写宏缓冲 | `setMacroBytes()` |
| `id_dynamic_keymap_macro_reset` | `0x10` | 清空宏 | `resetMacros()` |
| `id_dynamic_keymap_get_layer_count` | `0x11` | 层数（≥ Beta） | `getLayerCount()` |
| `id_dynamic_keymap_get_buffer` | `0x12` | 读 keymap 缓冲 | `getKeymapBuffer()` / `getKeymap()` |
| `id_dynamic_keymap_set_buffer` | `0x13` | 写 keymap 缓冲 | `setKeymapBuffer()` / `setKeymap()` |
| `id_dynamic_keymap_get_encoder` | `0x14` | 读编码器 | `getEncoder()` |
| `id_dynamic_keymap_set_encoder` | `0x15` | 写编码器 | `setEncoder()` |

常量导出：`CMD_VIA`（`@rdmctmzt/sdk-qmk`）。

### `0x02` / `0x03` 子命令（Byte1）

| 子 ID | 读 | 写 | 说明 |
|---|---|---|---|
| `0x01` | ✓ | — | 运行时间 |
| `0x02` | ✓ | ✓ | `layout_options` |
| `0x03` | ✓ | — | 矩阵扫描状态 |
| `0x04` | ✓ | — | 固件版本 |
| `0x05` | — | ✓ | 设备指示 |

导出：`KeyboardValue`。

### Custom 通道（`0x07`–`0x09`，Byte1）

| channel | 含义 |
|---|---|
| `0` | custom |
| `1` | backlight |
| `2` | rgb light |
| `3` | rgb matrix |
| `4` | audio |

导出：`CustomChannel`。value_id 由固件 / VIA JSON 定义（常见亮度、模式、速度、颜色等）。

### keymap / 宏分块

| 项 | 说明 |
|---|---|
| 单次最大载荷 | **28** 字节（不含 cmd/offset/size） |
| offset | **大端** 16-bit |
| keymap 单元 | 每键 2 字节大端 keycode |
