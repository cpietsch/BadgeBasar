S3_BUCKET = maps.nzzdali.ch
S3_PATH = nzzdata/badge-basar-fi5ogg4ab6box7que/
S3_PUBLIC_URL = http://$(S3_BUCKET).s3-website-eu-west-1.amazonaws.com/$(S3_PATH)

dependencies:
ifeq ($(strip $(shell { type s3cmd; } 2>/dev/null)),)
	$(error Install s3cmd using 'brew install s3cmd'. More info: http://s3tools.org/s3cmd)
endif

deploy: dependencies
	s3cmd sync --verbose --acl-public ./ s3://$(S3_BUCKET)/$(S3_PATH)
	@echo "Deployed to\n\033[0;32m$(S3_PUBLIC_URL)\033[0m"

server:
	@echo "Server listening on:\n\033[0;32mhttp://localhost:8000\033[0m"
	python -m SimpleHTTPServer 8000

.PHONY: dependencies deploy server
