#!/bin/bash

SETUP_VERSION="0.0.1"
PACKAGE_FILE="package.json"
INSTALL_LOG="setup.log"

OS=$(source /etc/os-release && echo "$NAME" | tr '[:upper:]' '[:lower:]')
NODE_VERSION="14.16.0"

### Terminal colour
red=$(tput setaf 1)
green=$(tput setaf 118)
yellow=$(tput setaf 11)
cyan=$(tput setaf 14)
clear=$(tput sgr0)
### Terminal colour

run_setup() {
    case $1 in
        "-i"|"--install")
            if is_compatible && install_ubuntu_debian ; then
                echo_success "nvm, nodejs and npm is installed."
                exit 1
            elif [[ $OS == *"arch"* ]]; then
                if install_node_arch ; then
                    echo_success "Successfully installed nodejs and npm"
                    exit 1
                fi
            elif $? -eq 200 ; then
                echo_warn "nvm installed but couldn't continue due to unidentified shell, please manually proceed. Exiting."
                exit 1
            else
                echo_error "Something went wrong. Is your system compatible? Check $INSTALL_LOG"
                exit 1
            fi
        ;;

        "-h"|"--help")
            echo "Usage -> setup.sh <arg> [-h|--help; show's this prompt] [ -i|--install; installs nvm,nodejs,npm ] "
            exit 0
        ;;

        *)
            echo_warn "No arguments supplied, proceeding with default setup"
            install_npm_packages
            return 0
        ;;
    esac
}

install_npm_packages() {
    echo_info "Proceeding with npm package install"
    echo_info "Checking if $PACKAGE_FILE exists"
    if [ ! -f ./$PACKAGE_FILE ] ; then
        echo_error "$PACKAGE_FILE does not exist! Cannot proceed with npm package requirement install"
        exit 1
    fi

    echo_info "$PACKAGE_FILE exists, proceeding with npm install"

    if npm install >> $INSTALL_LOG ; then
        echo_success "npm packages installed."
    else
        echo_error "Couldn't run npm install. Check $INSTALL_LOG. Exiting"
        exit 1
    fi
}

install_ubuntu_debian() {
    echo_info "Installing nvm"
    if wget -q https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh && ./install.sh >> $INSTALL_LOG; then
        echo_success "nvm install successful, proceeding with nodejs installation."
        rm ./install.sh
        if grep -q "bash" $SHELL ; then
            echo_info "Sourcing .bashrc nvm.sh"
            . ~/.bashrc
            . ~/.nvm/nvm.sh

        elif grep -q "zsh" $SHELL ; then
            echo_info "Sourcing .zshrc and nvm.sh"
            . ~/.zshrc
            . ~/.nvm/nvm.sh

        elif grep -q "ksh" $SHELL ; then
            echo "Sourcing .profile nvm.sh"
            . ~/.profile
            . ~/.nvm/nvm.sh

        else
            echo_warn "Cannot identify current shell. Please source or spawn a new shell instance for nvm commands to take effect."
            return 200
        fi

        if nvm install $NODE_VERSION >>$INSTALL_LOG ; then
            echo_success "Nodejs $NODE_VERSION has been installed via nvm"
            echo_info "Checking for npm install"
            if nvm install-latest-npm >>$INSTALL_LOG ; then
                echo_success "nvm successfully installed npm from current nodejs version"
                return 0
            else
                echo_error "Unable to install npm through nvm"
                return 1
            fi
        else
            echo_error "Unable to run nvm install $NODE_VERSION"
            return 1
        fi
    else 
        echo_error "Unable to wget nvm install.sh"
        return 1
    fi
}

install_node_arch() {
    pacman -S nodejs npm
}

is_compatible() {

    if [[ $OS == *"ubuntu"* ]]; then
        return 0
    elif [[ $OS == *"debian"* ]]; then
        return 0
    elif [[ $OS == *"arch"* ]]; then
        return 0
    else
        echo_error "$OS is not compatible. Exiting" >> $INSTALL_LOG  
        return 1
    fi
}

echo_error() {
    echo "[${red}ERROR${clear}] -> $*"
}

echo_warn() {
    echo "[${yellow}WARN${clear}] -> $*"
}

echo_info() {
    echo "[${cyan}INFO${clear}] -> $*"
}

echo_success() {
    echo "[${green}SUCCESS${clear}] -> $*"
}


prompt_yn() {
     case "$1" in
            [yY])
                return 0
            ;;

            [nN])
                return 1
            ;;

            *)
                echo_error "[ERROR] -> Unrecognised input."
                return 1
            ;;
        esac
}

if ! [ $(id -u) = 0 ]; then
    if [[ -x $0 ]]; then
        run_setup $1
    else
        echo_error "$0 is not executable, please run chmod +x $0"
    fi
else
    echo_error "DO NOT RUN THIS SCRIPT WITH SUDO/ROOT!"
    exit 1
fi
