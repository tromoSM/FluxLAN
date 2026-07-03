<p align=center>
 <img src="https://github.com/tromoSM/FluxLAN/blob/main/static/Assets/fluxlan-gitlogo.gif?raw=true">
</p>

# FluxLAN

<p align="center">
 <img width="500"  alt="image" src="https://github.com/user-attachments/assets/1dc7cae9-4237-482c-bd93-9f227e436c04" />
</p>

## Installation

<details>
 <summary>MacOS</summary>

 <details >
  <summary>Manual installation</summary>
  
  - Download [FluxLAN for MacOS](https://github.com/tromoSM/FluxLAN/releases/download/v1.0/FluxLAN-MacOS) or [FluxLAN Lite for MacOS](https://github.com/tromoSM/FluxLAN/releases/download/v1.0/FluxLAN-Lite-MacOS)
  - Open terminal in the folder containing the downloaded file and run
 ```bash
chmod +x FluxLAN-macOS
./FluxLAN-macOS
```
or the following command if you're using the lite version
```bash
chmod +x FluxLAN-Lite-macOS
./FluxLAN-Lite-macOS
```
  
 </details>
<details>
 <summary>Homebrew installation</summary>

 ```bash
brew tap tromosm/fluxlan
brew install fluxlan
```
 
</details>
</details>
<details>
 <summary>Windows</summary>
 
 - Download [FluxLAN](https://github.com/tromoSM/FluxLAN/releases/download/v1.0/FluxLAN-Windows.exe) or [FluxLAN Lite](https://github.com/tromoSM/FluxLAN/releases/download/v1.0/FluxLAN-Lite-Windows.exe) and install.
 - or install using winget 
```bash
winget install FluxLAN
```

</details>
<details>
 <summary>Linux</summary>
 <details>
  <summary>Ubuntu/debian</summary>

  > **For Debian users** \
  > Ubuntu/debian release is only tested on Ubuntu. If failed use Other Distros instruction.
  - Download [FluxLAN](https://github.com/tromoSM/FluxLAN/releases/download/v1.0/FluxLAN-Ubuntu.deb) or [FluxLAN Lite](https://github.com/tromoSM/FluxLAN/releases/download/v1.0/FluxLAN-Lite-Ubuntu.deb)
  - Open a terminal in the folder containing FluxLAN and run this command
  - ```bash
    sudo apt install ./FluxLAN-Ubuntu.deb
    ```
  - or if you're using FluxLAN lite,
  - ```bash
    sudo apt install ./FluxLAN-Lite-Ubuntu.deb
    ```
 </details>
 <details>
  <summary>Other Distros</summary>
  
  - Other Linux distributions are supported through the source code, but no official application is provided.
  ```bash
 git clone https://github.com/tromoSM/FluxLAN.git
```
  - and install dependencies
```bash
pip install -r requirements.txt
```
  - and run FluxLAN
```bash
python main.py
```
  - see [commands](#commands) for options.

 </details>
</details>

## Features
- No other setup/apps needed when connecting devices
- Motion detection
- High quality recording and capturing
- Scheduled capturing
- and much more

## Cross compatibility
- FluxLAN is available across MacOS, Windows and Ubuntu.
- Other Linux distributions are supported through the source code, but no official application is provided.

## Commands
 `[APP_PATH] help` to see all the commands.
 
 example : 

   `C:\Users\tromoSM\AppData\Local\Programs\FluxLAN> FluxLAN help`

## Remote accessing dashboard

- Use a service like [tailscale](https://tailscale.com/) to access your dashboard.
- Make sure to turn on "Allow other devices to access dashboard" in System tray -> Advanced -> Developer options
