# DeepTrafficPuppet

Automate MIT's DeepTraffic competition (https://selfdrivingcars.mit.edu/deeptraffic/) with Puppeteer.

## Installation

Run `yarn install`

## Running

Train, evaluate and save a net by running `node deeptrafficpuppet.js filename --save`.

## Troubleshooting

In certain Linux distros it may be necessary to enable sandboxing with
`echo 1 > /proc/sys/kernel/unprivileged_userns_clone`.

