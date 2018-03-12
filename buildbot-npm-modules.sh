#!/bin/sh

SRC="`readlink $0 2>/dev/null || echo $0`"
SRC="`dirname $SRC`"
cd $SRC

set -e

# This script looks for npm-shrinkwrap.json or package.json
# and creates and uploads tarbal of the node_modules to some
# file server $host. Uses a checksum of the json file to avoid
# doing work if the tarball already exists on the file server.

get_module()
{
    # Support mezzanine-web, plasma-web-proxy, and others?
    module=$(git remote -v | grep origin | head -n 1 | awk '{ print $2 }' | sed -e 's:.*/::g' -e 's:\.git.*::g')

    if test -z "$module"
    then
        echo "ERROR: could not determine module name from origin url" 2>&2
        exit 1
    fi
    echo $module
}

get_hash()
{
    if test -f npm-shrinkwrap.json
    then
        truth=npm-shrinkwrap.json
    else
        truth=package.json
    fi

    echo "Using $truth as source of truth" >&2

    hash=$(md5sum $truth | awk '{ print $1 }')

    if test -z "$hash"
    then
        echo "ERROR: could not generate md5sum hash from: $truth" >&2
        exit 1
    fi

    echo "HASH for $truth is: $hash" >&2
    echo $hash
}

do_upload()
{
    if ssh $host "test -f $basepath/$archive"
    then
        echo "$host:$basepath/$archive already exists, nothing to do"
        exit 0
    fi

    rm -rf node_modules
    export G_SPEAK_HOME=$(obs get-gspeak-home)
    npm install
    tar czf $archive node_modules
    ssh $host "mkdir -p $basepath"
    scp $archive $host:$basepath/
    ssh $host "test -f $basepath/$archive" # sanity check
}

do_download()
{
    if ! ssh $host "test -f $basepath/$archive"
    then
        echo
        echo "WARNING: $archive is missing. I'll try to build it myself."
        echo
        do_upload
        if ! ssh $host "test -f $basepath/$archive"
        then
            echo
            echo "ERROR: Hmm, I couldn't build $archive myself. Try doing this:"
            echo
            echo "    $0 upload"
            echo
            exit 1
        fi
    fi

    scp $host:$basepath/$archive .
    rm -rf node_modules
    tar xzf $archive
}

do_usage()
{
    echo "USAGE: $0 <upload|download>"
    echo
    echo "upload - creates tarball of npm_modules from scratch and uploads it for use by buildbot"
    echo "download - downloads tarball of npm_modules created for buildbot"
    echo
    exit 1
}

case $1 in
    download|upload) : ;;
    *) do_usage ;;
esac

host=git.oblong.com
basepath=/ob/buildtools/src-mirrors/$(get_module)
archive=node_modules.gs$(obs get-gspeak-version).$(obs detect-os).$(get_hash).tar.gz

case $1 in
    download) do_download ;;
    upload) do_upload ;;
esac

# end of file
