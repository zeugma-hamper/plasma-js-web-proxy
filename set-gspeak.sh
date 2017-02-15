#!/bin/sh
#
# Run this script before doing 'debuild' if you want to select a different
# version of g-speak

set -x
set -e

version=$1

case "$version" in
[3-9].[0-9]*) ;;
*)
    echo "Usage: $0 G_SPEAK_VERSION"
    echo "example: $0 3.8"
    exit 1
    ;;
esac

# Update the version number in all instances of the strings
# oblong-plasma-web-proxy-gs3.X in files in debian directory
sed -i.bak \
    -e "s/-gs[3-9].[0-9][0-9]*x/-gs${version}x/g" \
    -e "s/oblong-system-protist[3-9].[0-9][0-9]*/oblong-system-protist${version}/g" \
    debian/control debian/changelog debian/postinst debian/prerm Makefile
