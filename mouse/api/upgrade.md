# 在线升级

有线鼠标固件与 1K 键盘走同一套 USB-IAP。升级类是 `KeyboardFirmwareUpgrade`，从 `@rdmctmzt/sdk-keyboard` 引入，不挂在 `Mouse` 上。`@rdmctmzt/sdk-mouse` 没有单独的升级类。

鼠标日常通讯口已经是 Usage Page `FF00`、Usage `1`，和切 Boot 用的是同一个口。键盘日常口是 `FF60`，升级才切到 `FF00`。

## 注意事项

| 条件 | 说明 |
|---|---|
| 浏览器 | Chrome / Edge，页面必须是 HTTPS 或 `localhost` |
| 只刷有线鼠标 | 经 2.4G 接收器连接时不升级鼠标本体。接收器自己的固件不在本页 |
| 先放开日常口 | 升级前 `close()` 已连接的 `Mouse`。这个 FF00 口还占着时，切 Boot 打不开 |
| 固件 | IAP bin。长度至少 130 字节；偏移 66 的小端 `uint16` 是块大小，小于 16 视为无效 |
| 不要拔线 | 写入过程中鼠标会重启并重新枚举 |
| 两次授权 | `start()` 选当前鼠标的 FF00。切 Boot 后 PID 变成 `33FF` / `55FF` / `66FF`，浏览器里还没授权过就要再点一次 `authorizeBoot()` |
| 手势 | `requestDevice` 必须在点击里调用。`BootAuthRequired` 之后不能接着在同一次点击里再弹窗，要单独一个按钮 |

应答 `ErrCode`：

| 值 | 含义 |
|---|---|
| `0x00` | 成功 |
| `0xE1` | Length 错误 |
| `0xE2` | CRC 错误 |
| `0xE3` | 块号错误（SDK 会重头发头并整包重传，最多 3 轮） |
| `0xE4` | 块大小错误（同上，整包重传） |
| `0xE5` | 写入偏移错误（同上） |
| `0xE8` | FLASH 操作失败 |
| `0xE9` | 状态不满足（同上） |
| `0xF0` | 升级标记不匹配 |
| `0xF1` | 芯片代号错误 |
| `0xF2` | 项目代号错误 |

`0xF0`–`0xF8` 直接失败，不重传。

---

## 开始升级

`upgrade.start()`

弹出授权框，过滤器是当前 VID / PID、Usage Page `0xFF00`、Usage `1`。选中后发切 Boot（命令 `0xC0`），等设备重新枚举。

已经授权过的 Boot 口会接着写固件。还没授权则抛出 `Error`，`name` 为 `BootAuthRequired`。这条错误的文案写的是键盘，鼠标同样按这个 `name` 处理。

### 参数

构造 `new KeyboardFirmwareUpgrade(options)`：

| 参数 | 类型 | 说明 |
|---|---|---|
| `options.vendorId` | `number` | 鼠标 VID |
| `options.productId` | `number` | 鼠标应用态 PID，不是 Boot PID |
| `options.firmware` | `Uint8Array` | IAP bin 全文 |
| `options.onProgress` | `function?` | `(state: FirmwareUpgradeProgress) => void` |

`start()` 本身无参数。

### 返回值

`Promise<void>`。完成表示已切回应用，鼠标会重新枚举，之后要重新 `getDevices()` / `init()`。

### 使用示例

```js
import Mouse from '@rdmctmzt/sdk-mouse'
import { KeyboardFirmwareUpgrade } from '@rdmctmzt/sdk-keyboard'

const vendorId = 0x0000
const productId = 0x0000
const ServiceMouse = new Mouse({
  configs: [{ vendorId, productId, usagePage: 0xff00, usage: 1 }],
})

document.querySelector('#upgrade').onclick = async () => {
  const file = document.querySelector('#bin').files[0]
  const firmware = new Uint8Array(await file.arrayBuffer())
  await ServiceMouse.close()

  const upgrade = new KeyboardFirmwareUpgrade({
    vendorId,
    productId,
    firmware,
    onProgress({ percent, message }) {
      console.log(percent, message)
    },
  })
  window.__mouseUpgrade = upgrade

  try {
    await upgrade.start()
  } catch (error) {
    if (error.name !== 'BootAuthRequired') throw error
    document.querySelector('#boot').hidden = false
  }
}
```

---

## 授权 Boot 并继续

`upgrade.authorizeBoot()`

在另一次点击里调用。弹窗过滤器是 Boot PID `0x33FF` / `0x55FF` / `0x66FF`（VID 不是 `0x36B0` 时，同时带上 `0x36B0`）。选中 Boot 口后写入固件。

写入顺序：

1. `0xA0` 升级头：固件前 128 字节，CRC16-Modbus
2. `0xA1` 按固件头里的块大小写数据区（头之后的字节）。最后一块块号为 `0xFFFF`
3. `0xA4` 切回应用

HID 报告 ID 是 `0x3F`。业务包头是 `0xAA`，单包有效载荷最多 56 字节。

### 参数

无。固件和 VID 用构造时传入的那一份，中途不要换文件。

### 返回值

`Promise<void>`。成功后进度到 100。完成文案是「升级完成，键盘会重新枚举」，鼠标同样会重新枚举。

### 使用示例

```js
document.querySelector('#boot').onclick = async () => {
  await window.__mouseUpgrade.authorizeBoot()
}
```

---

## 进度

`onProgress` 收到 `FirmwareUpgradeProgress`：

| 字段 | 类型 | 说明 |
|---|---|---|
| `percent` | `number` | `0–100`。授权约 2，切 Boot 约 6，写块从 20 到 90，切应用 94，完成 100 |
| `message` | `string` | 当前步骤，例如 `写入 3/40` |

块号失步时 `message` 为「块号失步，重新开始后整包重传」，百分比回到 15，然后从头写。

类型定义在 `@rdmctmzt/sdk-keyboard`，见 [参数类型 · 在线升级](../types#在线升级)。
