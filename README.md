# Motexa 骑行

Motexa 骑行是一款面向电动两轮车用户的 Android 蓝牙工具应用，用于连接兼容的电池保护板和控制器，查看车辆电池状态、控制器状态、骑行数据和历史记录。

应用适合希望更直观了解车辆运行状态的用户，也适合需要排查电池、控制器、骑行能耗和蓝牙连接状态的玩家或维修调试场景。

## 主要功能

- 查看电池实时数据：电压、电流、SOC、电池功率、容量、温度、MOS 状态等。
- 查看电芯信息：支持展示单体电芯电压、压差和均衡相关状态。
- 查看控制器数据：支持兼容控制器的实时状态读取。
- 骑行实时页面：显示速度、功率、距离、能耗、效率和连接状态。
- 骑行记录：保存普通骑行记录，支持查看历史详情和导出数据。
- 零百测试：记录加速测试结果，并提供历史记录详情。
- 设备管理：扫描、连接和记忆常用 BMS 或控制器设备。
- 日志导出：遇到连接异常时，可导出诊断日志用于排查。
- 版本更新：应用可检查新版本，并根据版本策略提示更新。

## 兼容设备

当前应用主要围绕 BLE 电池保护板和电动车控制器读取场景开发，已接入或正在适配的设备类型包括：

- ANT BMS 新协议设备。
- ANT BMS 旧协议设备。
- JBD / 嘉佰达 BMS。
- JK / 极空 BMS。
- 蓝石 300 控制器。
- 远驱 / Fardriver 控制器只读方向。

不同批次、不同固件和不同厂商设备可能存在协议差异。实际可读字段以设备返回数据为准，若连接失败或数据异常，可以导出日志辅助排查。

## 安装说明

1. 下载 APK 安装包。
2. 在 Android 手机上打开安装包。
3. 如果系统提示“禁止安装未知来源应用”，请按系统提示允许当前浏览器或文件管理器安装应用。
4. 安装完成后打开“Motexa 骑行”。
5. 首次使用时，请阅读并确认应用内的用户协议和隐私说明。

建议从可信下载页或 Release 页面获取 APK。安装前可以核对发布页提供的版本号和 SHA-256，确认安装包没有被替换。

## 首次连接设备

1. 打开手机蓝牙。
2. 打开 Motexa 骑行，进入首次引导或“设备连接”页面。
3. 按系统弹窗允许蓝牙扫描和蓝牙连接权限。
4. 如果系统要求定位权限，请允许定位权限。部分 Android 版本需要定位权限才能扫描附近 BLE 设备。
5. 点击扫描，等待附近 BMS 或控制器出现在列表中。
6. 选择目标设备并连接。
7. 连接成功后，首页、电池页面或设备页面会显示实时数据。

如果列表中没有设备，请确认设备已经通电、手机蓝牙已开启、设备没有被其他 App 占用，并尽量靠近车辆或电池。

## 权限用途

- 蓝牙权限：用于扫描、连接和读取兼容的 BMS 或控制器。
- 定位权限：用于骑行速度、轨迹、零百测试，也用于部分 Android 版本的 BLE 扫描。
- 后台定位权限：仅在开启后台骑行记录时用于持续记录轨迹。
- 通知权限：用于显示骑行记录、后台连接和更新状态。
- 文件权限：用于导出日志、备份或骑行记录。
- 安装权限：用于安装下载的新版本 APK。

拒绝某些权限后，应用仍可打开，但对应功能可能无法使用。例如拒绝蓝牙权限后无法连接设备，拒绝定位权限后无法记录 GPS 速度和轨迹。

## 使用提醒

Motexa 骑行是非官方硬件工具，不替代车辆原厂仪表、BMS/控制器保护逻辑、安全装置或专业维修诊断。骑行过程中请专注路况，不要分心操作 App。涉及参数调整、控制命令或调试命令时，应在静止、断载或低风险环境中进行。

---

# Motexa Ride

Motexa Ride is an Android Bluetooth utility app for electric two-wheelers. It connects to compatible battery management systems and controllers, then shows battery status, controller data, ride metrics, and ride history in one place.

The app is designed for riders who want a clearer view of their vehicle status, and for users who need practical diagnostics for batteries, controllers, ride efficiency, and Bluetooth connectivity.

## Key Features

- Real-time battery data: voltage, current, state of charge, power, capacity, temperature, MOS status, and more.
- Cell details: individual cell voltage, voltage delta, highest/lowest cell, and balancing-related information.
- Controller data: real-time status reading for compatible controllers.
- Live ride dashboard: speed, power, distance, energy use, efficiency, and connection status.
- Ride records: save rides, view history, inspect details, and export data.
- Acceleration tests: record acceleration results and review past test details.
- Device management: scan, connect, and remember common BMS or controller devices.
- Diagnostic logs: export logs when Bluetooth connection or data reading needs troubleshooting.
- Version updates: check for newer versions and show update prompts according to the release policy.

## Compatible Devices

Motexa Ride focuses on BLE battery management systems and electric vehicle controllers. The currently supported or actively adapted device families include:

- ANT BMS new-protocol devices.
- ANT BMS legacy-protocol devices.
- JBD BMS.
- JK BMS.
- BlueStone 300 controllers.
- Fardriver controller read-only support direction.

Different device batches, firmware versions, and manufacturers may use different protocol details. The actual visible fields depend on the data returned by the connected device. If connection or data reading fails, exported logs can help with troubleshooting.

## Installation

1. Download the APK installer.
2. Open the APK on your Android phone.
3. If Android blocks installation from unknown sources, allow installation for the current browser or file manager as prompted by the system.
4. Open “Motexa Ride” after installation.
5. On first launch, read and accept the in-app user agreement and privacy notice.

Download the APK only from a trusted release page. Before installing, you can compare the version number and SHA-256 hash shown on the release page to make sure the installer has not been replaced.

## First Device Connection

1. Turn on Bluetooth on your phone.
2. Open Motexa Ride and go to the onboarding flow or the device connection page.
3. Allow Bluetooth scan and Bluetooth connection permissions when Android asks.
4. Allow location permission if Android asks for it. Some Android versions require location permission for BLE scanning.
5. Start scanning and wait for nearby BMS or controller devices to appear.
6. Select the target device and connect.
7. After a successful connection, real-time data will appear on the home, battery, or device page.

If no device appears, make sure the device is powered on, Bluetooth is enabled, the device is not already connected to another app, and the phone is close to the battery or vehicle.

## Permissions

- Bluetooth permission: scans, connects to, and reads compatible BMS or controller devices.
- Location permission: provides GPS speed, route, and acceleration test data; also required for BLE scanning on some Android versions.
- Background location permission: used only when background ride recording is enabled.
- Notification permission: shows ride recording, background connection, and update status.
- File permission: exports logs, backups, or ride records.
- Install permission: installs a downloaded APK update.

If some permissions are denied, the app can still open, but related features may not work. For example, denying Bluetooth permission prevents device connection, and denying location permission prevents GPS speed and route recording.

## Safety Notice

Motexa Ride is an unofficial hardware utility. It does not replace the original vehicle dashboard, BMS/controller protection logic, safety devices, or professional repair diagnostics. Stay focused on the road while riding and avoid operating the app during travel. Any parameter changes, control commands, or debugging commands should be performed only while stationary, unloaded, or in a low-risk environment.
