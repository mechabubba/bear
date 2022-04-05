#!/bin/bash

SETUP_VERSION="0.0.1"
PACKAGE_FILE="package.json"
INSTALL_LOG="setup.log"

OS=$(source /etc/os-release && echo "$NAME" | tr '[:upper:]' '[:lower:]')
NODE_VERSION="14.16.0"

### Terminal colour
RED=$(tput setaf 1)
GREEN=$(tput setaf 118)
YELLOW=$(tput setaf 11)
CYAN=$(tput setaf 14)
CLEAR=$(tput sgr0)
### Terminal colour

run_setup() {
    case $1 in
        "-i"|"--install")
            if is_compatible; then
                if [[ $OS == *"arch"* ]]; then
                    echo_info "Installing nvm, nodejs & npm for arch"
                    if install_node_arch ; then
                        echo_success "Installed."
                    else
                        echo_error "Couldn't install! Exiting." 1>&2
                        exit 1
                    fi
                elif [[ $OS == *"debian"* ]] || [[ $OS == *"ubuntu"* ]] ; then
                    if install_ubuntu_debian ; then
                        echo_success "Installed."
                    else
                        echo_error "Couldn't install! Exiting." 1>&2
                        exit 1
                    fi
                else
                    echo_error "Something went wrong during check"
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
            print_help
            exit 0
        ;;

        *)
            echo_warn "No arguments supplied, proceeding with default setup"
            install_npm_packages
            exit 0
        ;;
    esac
}

print_help() {
    cat << EOF

${GREEN}USAGE: ./setup.sh <args> <options>${CLEAR}

${YELLOW}==== Args ====${CLEAR}

${YELLOW}-h${CLEAR} | ${YELLOW}--help${CLEAR} -> The current help menu
${YELLOW}-i${CLEAR} | ${YELLOW}--install${CLEAR} -> complete install of nvm, npm, nodejs

EOF
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
        echo_error "Couldn't run npm install. Exiting." 1>&2
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
            exit 1
        fi

        if nvm install $NODE_VERSION >>$INSTALL_LOG ; then
            echo_success "Nodejs $NODE_VERSION has been installed via nvm"
            echo_info "Checking for npm install"
            if nvm install-latest-npm >>$INSTALL_LOG ; then
                echo_success "nvm successfully installed npm from current nodejs version"
                exit 0
            else
                echo_error "Unable to install npm through nvm" 1>&2
                exit 1
            fi
        else
            echo_error "Unable to run nvm install $NODE_VERSION" 1>&2
            exit 1
        fi
    else 
        echo_error "Unable to wget nvm install.sh" 1>&2
        exit 1
    fi
}

install_node_arch() {
    TEMP_DIR="/tmp/nvm-arch"
    NVM_URL="https://github.com/nvm-sh/nvm"

    echo_info "Creating working directory for nvm upstream $NVM_URL"
    if mkdir "$TEMP_DIR" ; then
        echo_success "Working directory created"
        echo_info "Cloning nvm upstream url"
        if git clone $NVM_URL "$TEMP_DIR" ; then 
            echo_success "nvm cloned into $TEMP_DIR, changing dir and making package"
            if cd /tmp/nvm-arch && makepkg -si ; then
                echo_success "NVM has been installed through the AUR."
            else
                echo_error "Unable to makepkg -si in /opt/nvm-arch" 1>&2
                exit 1
            fi
        else
            echo_error "Unable to pull nvm aur upstream ${CYAN}$NVM_URL${CLEAR}" 1>&2
            exit 1
        fi
    else
        echo_error "Unable to make temporary directory $TEMP_DIR" 1>&2
        exit 1
    fi

    echo_info "Installing nodejs and npm"
    if pacman -S nodejs npm ; then
        echo_success "Nodejs and npm installed through pacman"
        exit 0
    else
        echo_error "Unable to install nodejs and npm through pacman" 1>&2
        exit 1
    fi
        
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
    echo "[${RED}ERROR${CLEAR}] -> $*"
}

echo_warn() {
    echo "[${YELLOW}WARN${CLEAR}] -> $*"
}

echo_info() {
    echo "[${CYAN}INFO${CLEAR}] -> $*"
}

echo_success() {
    echo "[${GREEN}SUCCESS${CLEAR}] -> $*"
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
    echo_error "No need to run as root."
    exit 1
fi
